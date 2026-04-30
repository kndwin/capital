import { Context, Effect, Layer } from "effect";
import { asc, eq, sql } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import type {
  CompanyCheck,
  CompanyCheckInsight,
  CompanyCheckOverride,
  CompanyCheckRun,
  CompanyEngineCheck,
} from "./company-check.schema";
import {
  companyCheck,
  companyCheckInsight,
  companyCheckOverride,
  companyCheckRun,
  companyEngineCheck,
} from "./company-check.table";

type CompanyCheckRow = typeof companyCheck.$inferSelect;
type CompanyCheckRunRow = typeof companyCheckRun.$inferSelect;
type CompanyEngineCheckRow = typeof companyEngineCheck.$inferSelect;
type CompanyCheckOverrideRow = typeof companyCheckOverride.$inferSelect;
type CompanyCheckInsightRow = typeof companyCheckInsight.$inferSelect;

const toCompanyCheck = (row: CompanyCheckRow): CompanyCheck => ({
  id: row.id,
  companyId: row.companyId,
  checkDefinitionId: `seed.${row.groupId}.${row.id}`,
  groupId: row.groupId,
  groupLabel: row.groupLabel,
  label: row.label,
  status: row.status as CompanyCheck["status"],
  score: statusToScore({ status: row.status as CompanyCheck["status"] }),
  detail: row.detail,
  rationale: row.detail ?? "Seeded check.",
  source: "seed",
  overrideId: null,
  supportingInsightIds: [],
  order: row.order,
  updatedAt: row.updatedAt.getTime(),
});

const toCompanyCheckRun = (row: CompanyCheckRunRow): CompanyCheckRun => ({
  id: row.id,
  companyId: row.companyId,
  status: row.status as CompanyCheckRun["status"],
  engineVersion: row.engineVersion,
  inputHash: row.inputHash,
  reason: row.reason,
  error: row.error,
  updatedAt: row.updatedAt.getTime(),
});

const toCompanyEngineCheck = (row: CompanyEngineCheckRow): CompanyEngineCheck => ({
  id: row.id,
  companyId: row.companyId,
  checkDefinitionId: row.checkDefinitionId,
  groupId: row.groupId,
  groupLabel: row.groupLabel,
  label: row.label,
  status: row.status as CompanyEngineCheck["status"],
  score: row.score,
  detail: row.detail,
  rationale: row.rationale,
  runId: row.runId,
  engineVersion: row.engineVersion,
  inputHash: row.inputHash,
  order: row.order,
  updatedAt: row.updatedAt.getTime(),
});

const toCompanyCheckOverride = (row: CompanyCheckOverrideRow): CompanyCheckOverride => ({
  id: row.id,
  companyId: row.companyId,
  checkDefinitionId: row.checkDefinitionId,
  status: row.status as CompanyCheckOverride["status"],
  score: row.score,
  detail: row.detail,
  rationale: row.rationale,
  createdByUserId: row.createdByUserId,
  updatedAt: row.updatedAt.getTime(),
});

const toCompanyCheckInsight = (row: CompanyCheckInsightRow): CompanyCheckInsight => ({
  id: row.id,
  companyId: row.companyId,
  checkDefinitionId: row.checkDefinitionId,
  insightId: row.insightId,
  runId: row.runId,
  relationship: row.relationship as CompanyCheckInsight["relationship"],
  updatedAt: row.updatedAt.getTime(),
});

export class CompanyCheckRepo extends Context.Service<CompanyCheckRepo>()(
  "module/CompanyCheckRepo",
  {
    make: Effect.gen(function* () {
      const db = yield* Db;
      return {
        upsertCheck: Effect.fn("CompanyCheckRepo.upsertCheck")(function* (input: CompanyCheck) {
          yield* db.query((d) =>
            d
              .insert(companyCheck)
              .values({
                id: input.id,
                companyId: input.companyId,
                groupId: input.groupId,
                groupLabel: input.groupLabel,
                label: input.label,
                status: input.status,
                detail: input.detail,
                order: input.order,
              })
              .onConflictDoUpdate({
                target: companyCheck.id,
                set: {
                  companyId: input.companyId,
                  groupId: input.groupId,
                  groupLabel: input.groupLabel,
                  label: input.label,
                  status: input.status,
                  detail: input.detail,
                  order: input.order,
                  updatedAt: sql`now()`,
                },
              }),
          );
          return input;
        }),
        upsertCheckRun: Effect.fn("CompanyCheckRepo.upsertCheckRun")(function* (
          input: CompanyCheckRun,
        ) {
          yield* db.query((d) =>
            d
              .insert(companyCheckRun)
              .values({
                id: input.id,
                companyId: input.companyId,
                status: input.status,
                engineVersion: input.engineVersion,
                inputHash: input.inputHash,
                reason: input.reason,
                error: input.error,
              })
              .onConflictDoUpdate({
                target: companyCheckRun.id,
                set: {
                  status: input.status,
                  engineVersion: input.engineVersion,
                  inputHash: input.inputHash,
                  reason: input.reason,
                  error: input.error,
                  updatedAt: sql`now()`,
                },
              }),
          );
          return input;
        }),
        upsertEngineCheck: Effect.fn("CompanyCheckRepo.upsertEngineCheck")(function* (
          input: CompanyEngineCheck,
        ) {
          yield* db.query((d) =>
            d
              .insert(companyEngineCheck)
              .values({
                id: input.id,
                companyId: input.companyId,
                checkDefinitionId: input.checkDefinitionId,
                groupId: input.groupId,
                groupLabel: input.groupLabel,
                label: input.label,
                status: input.status,
                score: input.score,
                detail: input.detail,
                rationale: input.rationale,
                runId: input.runId,
                engineVersion: input.engineVersion,
                inputHash: input.inputHash,
                order: input.order,
              })
              .onConflictDoUpdate({
                target: companyEngineCheck.id,
                set: {
                  status: input.status,
                  score: input.score,
                  detail: input.detail,
                  rationale: input.rationale,
                  runId: input.runId,
                  engineVersion: input.engineVersion,
                  inputHash: input.inputHash,
                  order: input.order,
                  updatedAt: sql`now()`,
                },
              }),
          );
          return input;
        }),
        upsertCheckOverride: Effect.fn("CompanyCheckRepo.upsertCheckOverride")(function* (
          input: CompanyCheckOverride,
        ) {
          yield* db.query((d) =>
            d
              .insert(companyCheckOverride)
              .values({
                id: input.id,
                companyId: input.companyId,
                checkDefinitionId: input.checkDefinitionId,
                status: input.status,
                score: input.score,
                detail: input.detail,
                rationale: input.rationale,
                createdByUserId: input.createdByUserId,
              })
              .onConflictDoUpdate({
                target: companyCheckOverride.id,
                set: {
                  status: input.status,
                  score: input.score,
                  detail: input.detail,
                  rationale: input.rationale,
                  createdByUserId: input.createdByUserId,
                  updatedAt: sql`now()`,
                },
              }),
          );
          return input;
        }),
        upsertCheckInsight: Effect.fn("CompanyCheckRepo.upsertCheckInsight")(function* (
          input: CompanyCheckInsight,
        ) {
          yield* db.query((d) =>
            d
              .insert(companyCheckInsight)
              .values({
                id: input.id,
                companyId: input.companyId,
                checkDefinitionId: input.checkDefinitionId,
                insightId: input.insightId,
                runId: input.runId,
                relationship: input.relationship,
              })
              .onConflictDoUpdate({
                target: companyCheckInsight.id,
                set: {
                  runId: input.runId,
                  relationship: input.relationship,
                  updatedAt: sql`now()`,
                },
              }),
          );
          return input;
        }),
        deleteCheckInsights: Effect.fn("CompanyCheckRepo.deleteCheckInsights")(function* (
          companyId: string,
        ) {
          yield* db.query((d) =>
            d.delete(companyCheckInsight).where(eq(companyCheckInsight.companyId, companyId)),
          );
        }),
        listSeedChecks: Effect.fn("CompanyCheckRepo.listSeedChecks")(function* (companyId: string) {
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(companyCheck)
              .where(eq(companyCheck.companyId, companyId))
              .orderBy(asc(companyCheck.order)),
          );
          return rows.map((row) => toCompanyCheck(row as CompanyCheckRow));
        }),
        listEngineChecks: Effect.fn("CompanyCheckRepo.listEngineChecks")(function* (
          companyId: string,
        ) {
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(companyEngineCheck)
              .where(eq(companyEngineCheck.companyId, companyId))
              .orderBy(asc(companyEngineCheck.order)),
          );
          return rows.map((row) => toCompanyEngineCheck(row as CompanyEngineCheckRow));
        }),
        listCheckOverrides: Effect.fn("CompanyCheckRepo.listCheckOverrides")(function* (
          companyId: string,
        ) {
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(companyCheckOverride)
              .where(eq(companyCheckOverride.companyId, companyId)),
          );
          return rows.map((row) => toCompanyCheckOverride(row as CompanyCheckOverrideRow));
        }),
        listCheckInsights: Effect.fn("CompanyCheckRepo.listCheckInsights")(function* (
          companyId: string,
        ) {
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(companyCheckInsight)
              .where(eq(companyCheckInsight.companyId, companyId)),
          );
          return rows.map((row) => toCompanyCheckInsight(row as CompanyCheckInsightRow));
        }),
        findCompletedCheckRunByInputHash: Effect.fn(
          "CompanyCheckRepo.findCompletedCheckRunByInputHash",
        )(function* (companyId: string, inputHash: string) {
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(companyCheckRun)
              .where(eq(companyCheckRun.companyId, companyId))
              .orderBy(asc(companyCheckRun.updatedAt)),
          );
          return rows
            .map((row) => toCompanyCheckRun(row as CompanyCheckRunRow))
            .find((run) => run.status === "completed" && run.inputHash === inputHash);
        }),
      } as const;
    }),
  },
) {}

function statusToScore({ status }: { readonly status: CompanyCheck["status"] }) {
  switch (status) {
    case "pass":
      return 100;
    case "concern":
      return 60;
    case "fail":
      return 20;
    case "unknown":
      return 0;
  }
}

export const CompanyCheckRepoLive = Layer.effect(CompanyCheckRepo, CompanyCheckRepo.make);
