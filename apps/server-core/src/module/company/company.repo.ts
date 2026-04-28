import { Context, Effect, Layer } from "effect";
import { eq, sql } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import { company } from "./company.table";
import type { Company } from "./company.schema";

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
    } as const;
  }),
}) {}

export const CompanyRepoLive = Layer.effect(CompanyRepo, CompanyRepo.make);
