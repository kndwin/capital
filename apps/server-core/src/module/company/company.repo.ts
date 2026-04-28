import { Context, Effect, Layer } from "effect";
import { asc, eq, sql } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import { company, companySource, companySourceInsight } from "./company.table";
import type { Company, CompanySource, CompanySourceInsight } from "./company.schema";

const selection = {
  id: company.id,
  name: company.name,
  description: company.description,
  website: company.website,
  stage: company.stage,
  sector: company.sector,
  location: company.location,
  score: company.score,
  riskLevel: company.riskLevel,
  updatedAt: company.updatedAt,
} as const;

type CompanyRow = typeof company.$inferSelect;
type CompanySourceRow = typeof companySource.$inferSelect;
type CompanySourceInsightRow = typeof companySourceInsight.$inferSelect;

const toCompany = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  description: row.description,
  website: row.website,
  stage: row.stage as Company["stage"],
  sector: row.sector,
  location: row.location,
  score: row.score,
  riskLevel: row.riskLevel as Company["riskLevel"],
  updatedAt: row.updatedAt.getTime(),
});

const toCompanySource = (row: CompanySourceRow): CompanySource => ({
  id: row.id,
  companyId: row.companyId,
  kind: row.kind as CompanySource["kind"],
  title: row.title,
  subtitle: row.subtitle,
  confidence: row.confidence,
  selected: row.selected,
  order: row.order,
  updatedAt: row.updatedAt.getTime(),
});

const toCompanySourceInsight = (row: CompanySourceInsightRow): CompanySourceInsight => ({
  id: row.id,
  companyId: row.companyId,
  sourceId: row.sourceId,
  kind: row.kind as CompanySourceInsight["kind"],
  locator: row.locator,
  text: row.text,
  extractorVersion: row.extractorVersion,
  insightWorkflowRunId: row.insightWorkflowRunId,
  order: row.order,
  updatedAt: row.updatedAt.getTime(),
});

export class CompanyRepo extends Context.Service<CompanyRepo>()("module/CompanyRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;
    return {
      upsert: Effect.fn("CompanyRepo.upsert")(function* (input: Company) {
        yield* Effect.annotateCurrentSpan({ "company.id": input.id });
        yield* db.query((d) =>
          d
            .insert(company)
            .values({
              id: input.id,
              name: input.name,
              description: input.description,
              website: input.website,
              stage: input.stage,
              sector: input.sector,
              location: input.location,
              score: input.score,
              riskLevel: input.riskLevel,
            })
            .onConflictDoUpdate({
              target: company.id,
              set: {
                name: input.name,
                description: input.description,
                website: input.website,
                stage: input.stage,
                sector: input.sector,
                location: input.location,
                score: input.score,
                riskLevel: input.riskLevel,
                updatedAt: sql`now()`,
              },
            }),
        );
        return input;
      }),
      get: Effect.fn("CompanyRepo.get")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "company.id": id });
        const rows = yield* db.query((d) =>
          d.select(selection).from(company).where(eq(company.id, id)).limit(1),
        );
        return rows[0] ? toCompany(rows[0] as CompanyRow) : undefined;
      }),
      list: Effect.fn("CompanyRepo.list")(function* () {
        const rows = yield* db.query((d) =>
          d.select(selection).from(company).orderBy(company.name),
        );
        return rows.map((row) => toCompany(row as CompanyRow));
      }),
      upsertSource: Effect.fn("CompanyRepo.upsertSource")(function* (input: CompanySource) {
        yield* db.query((d) =>
          d
            .insert(companySource)
            .values({
              id: input.id,
              companyId: input.companyId,
              kind: input.kind,
              title: input.title,
              subtitle: input.subtitle,
              confidence: input.confidence,
              selected: input.selected,
              order: input.order,
            })
            .onConflictDoUpdate({
              target: companySource.id,
              set: {
                companyId: input.companyId,
                kind: input.kind,
                title: input.title,
                subtitle: input.subtitle,
                confidence: input.confidence,
                selected: input.selected,
                order: input.order,
                updatedAt: sql`now()`,
              },
            }),
        );
        return input;
      }),
      upsertSourceInsight: Effect.fn("CompanyRepo.upsertSourceInsight")(function* (
        input: CompanySourceInsight,
      ) {
        yield* db.query((d) =>
          d
            .insert(companySourceInsight)
            .values({
              id: input.id,
              companyId: input.companyId,
              sourceId: input.sourceId,
              kind: input.kind,
              locator: input.locator,
              text: input.text,
              extractorVersion: input.extractorVersion,
              insightWorkflowRunId: input.insightWorkflowRunId,
              order: input.order,
            })
            .onConflictDoUpdate({
              target: companySourceInsight.id,
              set: {
                companyId: input.companyId,
                sourceId: input.sourceId,
                kind: input.kind,
                locator: input.locator,
                text: input.text,
                extractorVersion: input.extractorVersion,
                insightWorkflowRunId: input.insightWorkflowRunId,
                order: input.order,
                updatedAt: sql`now()`,
              },
            }),
        );
        return input;
      }),
      listSources: Effect.fn("CompanyRepo.listSources")(function* (companyId: string) {
        const rows = yield* db.query((d) =>
          d
            .select()
            .from(companySource)
            .where(eq(companySource.companyId, companyId))
            .orderBy(asc(companySource.order)),
        );
        return rows.map((row) => toCompanySource(row as CompanySourceRow));
      }),
      listSourceInsights: Effect.fn("CompanyRepo.listSourceInsights")(function* (
        companyId: string,
      ) {
        const rows = yield* db.query((d) =>
          d
            .select()
            .from(companySourceInsight)
            .where(eq(companySourceInsight.companyId, companyId))
            .orderBy(asc(companySourceInsight.order)),
        );
        return rows.map((row) => toCompanySourceInsight(row as CompanySourceInsightRow));
      }),
    } as const;
  }),
}) {}

export const CompanyRepoLive = Layer.effect(CompanyRepo, CompanyRepo.make);
