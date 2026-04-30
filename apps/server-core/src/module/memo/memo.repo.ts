import { Context, Effect, Layer } from "effect";
import { desc, eq } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import { companyMemo } from "./memo.table";
import type { MemoNarrative, MemoNarrativeConfig, MemoRecord } from "./memo.schema";

const withModuleLogs = Effect.annotateLogs({ module: "memo" });

type CompanyMemoRow = typeof companyMemo.$inferSelect;

const toRecord = (row: CompanyMemoRow): MemoRecord => ({
  id: row.id,
  companyId: row.companyId,
  narrative: row.narrative as MemoNarrative,
  config: row.config as MemoNarrativeConfig,
  createdAt: row.createdAt.getTime(),
});

export class MemoRepo extends Context.Service<MemoRepo>()("module/MemoRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;

    const save = Effect.fn("MemoRepo.save")(function* (input: {
      readonly id: string;
      readonly companyId: string;
      readonly narrative: MemoNarrative;
      readonly config: MemoNarrativeConfig;
    }) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.companyId });
      const rows = yield* db.query((d) =>
        d
          .insert(companyMemo)
          .values({
            id: input.id,
            companyId: input.companyId,
            narrative: input.narrative,
            config: input.config,
          })
          .returning(),
      );
      const row = rows[0];
      if (!row) {
        return yield* Effect.die(new Error("MemoRepo.save returned no row"));
      }
      return toRecord(row as CompanyMemoRow);
    }, withModuleLogs);

    const listByCompany = Effect.fn("MemoRepo.listByCompany")(function* (companyId: string) {
      const rows = yield* db.query((d) =>
        d
          .select()
          .from(companyMemo)
          .where(eq(companyMemo.companyId, companyId))
          .orderBy(desc(companyMemo.createdAt)),
      );
      return rows.map((row) => toRecord(row as CompanyMemoRow));
    }, withModuleLogs);

    return { save, listByCompany } as const;
  }),
}) {}

export const MemoRepoLive = Layer.effect(MemoRepo, MemoRepo.make);
