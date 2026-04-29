import { Context, Effect, Layer } from "effect";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  companyCheck,
  companyCheckInsight,
  companyCheckOverride,
  companyCheckRun,
  companyEngineCheck,
} from "../company-check/company-check.table";
import { Db } from "../../platform/db.contract";
import { company, companySource, companySourceInsight } from "./company.table";
import type {
  Company,
  CompanySource,
  CompanySourceAcquiredContent,
  CompanySourceInsight,
  CompanySourceStatus,
} from "./company.schema";

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
  status: row.status as CompanySource["status"],
  title: row.title,
  subtitle: row.subtitle,
  confidence: row.confidence,
  selected: row.selected,
  order: row.order,
  url: row.url,
  fileName: row.fileName,
  fileUrl: row.fileUrl,
  acquiredProvider: row.acquiredProvider,
  acquiredText: row.acquiredText,
  acquiredTextTruncated: row.acquiredTextTruncated,
  acquiredTextCharCount: row.acquiredTextCharCount,
  acquiredTextHash: row.acquiredTextHash,
  error: row.error,
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
      delete: Effect.fn("CompanyRepo.delete")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "company.id": id });
        yield* db.query((d) =>
          d.delete(companyCheckInsight).where(eq(companyCheckInsight.companyId, id)),
        );
        yield* db.query((d) =>
          d.delete(companyCheckOverride).where(eq(companyCheckOverride.companyId, id)),
        );
        yield* db.query((d) =>
          d.delete(companyEngineCheck).where(eq(companyEngineCheck.companyId, id)),
        );
        yield* db.query((d) => d.delete(companyCheckRun).where(eq(companyCheckRun.companyId, id)));
        yield* db.query((d) => d.delete(companyCheck).where(eq(companyCheck.companyId, id)));
        yield* db.query((d) =>
          d.delete(companySourceInsight).where(eq(companySourceInsight.companyId, id)),
        );
        yield* db.query((d) => d.delete(companySource).where(eq(companySource.companyId, id)));
        yield* db.query((d) => d.delete(company).where(eq(company.id, id)));
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
              status: input.status,
              title: input.title,
              subtitle: input.subtitle,
              confidence: input.confidence,
              selected: input.selected,
              order: input.order,
              url: input.url,
              fileName: input.fileName,
              fileUrl: input.fileUrl,
              acquiredProvider: input.acquiredProvider,
              acquiredText: input.acquiredText,
              acquiredTextTruncated: input.acquiredTextTruncated,
              acquiredTextCharCount: input.acquiredTextCharCount,
              acquiredTextHash: input.acquiredTextHash,
              error: input.error,
            })
            .onConflictDoUpdate({
              target: companySource.id,
              set: {
                companyId: input.companyId,
                kind: input.kind,
                status: input.status,
                title: input.title,
                subtitle: input.subtitle,
                confidence: input.confidence,
                selected: input.selected,
                order: input.order,
                url: input.url,
                fileName: input.fileName,
                fileUrl: input.fileUrl,
                acquiredProvider: input.acquiredProvider,
                acquiredText: input.acquiredText,
                acquiredTextTruncated: input.acquiredTextTruncated,
                acquiredTextCharCount: input.acquiredTextCharCount,
                acquiredTextHash: input.acquiredTextHash,
                error: input.error,
                updatedAt: sql`now()`,
              },
            }),
        );
        return input;
      }),
      getSource: Effect.fn("CompanyRepo.getSource")(function* (id: string) {
        const rows = yield* db.query((d) =>
          d.select().from(companySource).where(eq(companySource.id, id)).limit(1),
        );
        return rows[0] ? toCompanySource(rows[0] as CompanySourceRow) : undefined;
      }),
      getSourceAcquiredText: Effect.fn("CompanyRepo.getSourceAcquiredText")(function* (id: string) {
        const rows = yield* db.query((d) =>
          d
            .select({ acquiredText: companySource.acquiredText })
            .from(companySource)
            .where(eq(companySource.id, id))
            .limit(1),
        );
        return rows[0]?.acquiredText ?? null;
      }),
      updateSourceStatus: Effect.fn("CompanyRepo.updateSourceStatus")(function* (input: {
        readonly id: string;
        readonly status: CompanySourceStatus;
        readonly error: string | null;
      }) {
        yield* db.query((d) =>
          d
            .update(companySource)
            .set({ status: input.status, error: input.error, updatedAt: sql`now()` })
            .where(eq(companySource.id, input.id)),
        );
      }),
      updateSourceAcquiredContent: Effect.fn("CompanyRepo.updateSourceAcquiredContent")(
        function* (input: {
          readonly sourceId: string;
          readonly content: CompanySourceAcquiredContent;
        }) {
          yield* db.query((d) =>
            d
              .update(companySource)
              .set({
                subtitle: input.content.finalUrl,
                url: input.content.finalUrl,
                acquiredProvider: input.content.provider,
                acquiredText: input.content.text,
                acquiredTextTruncated: input.content.textTruncated,
                acquiredTextCharCount: input.content.textCharCount,
                acquiredTextHash: input.content.textHash,
                error: null,
                updatedAt: sql`now()`,
              })
              .where(eq(companySource.id, input.sourceId)),
          );
        },
      ),
      nextSourceOrder: Effect.fn("CompanyRepo.nextSourceOrder")(function* (companyId: string) {
        const rows = yield* db.query((d) =>
          d
            .select({ order: companySource.order })
            .from(companySource)
            .where(eq(companySource.companyId, companyId))
            .orderBy(desc(companySource.order))
            .limit(1),
        );
        return (rows[0]?.order ?? 0) + 10;
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
