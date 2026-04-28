import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { CompanyCheckService } from "../company-check/company-check.service";
import { ErrorCompanyNotFound } from "./company.error";
import { CompanyRepo } from "./company.repo";
import { CompanyService, CompanyServiceLive } from "./company.service";
import type { Company, CompanySource, CompanySourceInsight } from "./company.schema";

const sample: Company = {
  id: "sample-company",
  name: "Sample Company",
  description: "A sample diligence target.",
  website: "https://sample.example",
  stage: "seed",
  sector: "Enterprise Software",
  location: "San Francisco, CA",
  score: 79,
  riskLevel: "medium",
  updatedAt: 1_777_334_400_000,
};

const enqueued: Array<{
  readonly companyId: string;
  readonly reason: string;
  readonly inputKey: string;
}> = [];

const TestRepoLive = Layer.effect(
  CompanyRepo,
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<string, Company>());
    const sources = yield* Ref.make(new Map<string, CompanySource>());
    const insights = yield* Ref.make(new Map<string, CompanySourceInsight>());
    return CompanyRepo.of({
      upsert: Effect.fn("CompanyRepoTest.upsert")(function* (input: Company) {
        yield* Ref.update(store, (companies) => new Map(companies).set(input.id, input));
        return input;
      }),
      get: Effect.fn("CompanyRepoTest.get")(function* (id: string) {
        return (yield* Ref.get(store)).get(id);
      }),
      list: Effect.fn("CompanyRepoTest.list")(function* () {
        return Array.from((yield* Ref.get(store)).values());
      }),
      upsertSource: Effect.fn("CompanyRepoTest.upsertSource")(function* (input: CompanySource) {
        yield* Ref.update(sources, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      upsertSourceInsight: Effect.fn("CompanyRepoTest.upsertSourceInsight")(function* (
        input: CompanySourceInsight,
      ) {
        yield* Ref.update(insights, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      listSources: Effect.fn("CompanyRepoTest.listSources")(function* (companyId: string) {
        return Array.from((yield* Ref.get(sources)).values()).filter(
          (source) => source.companyId === companyId,
        );
      }),
      listSourceInsights: Effect.fn("CompanyRepoTest.listSourceInsights")(function* (
        companyId: string,
      ) {
        return Array.from((yield* Ref.get(insights)).values()).filter(
          (insight) => insight.companyId === companyId,
        );
      }),
    });
  }),
);

const TestCheckServiceLive = Layer.succeed(
  CompanyCheckService,
  CompanyCheckService.of({
    upsertCheck: (input) => Effect.succeed(input),
    upsertCheckOverride: (input) => Effect.succeed(input),
    enqueueRun: Effect.fn("CompanyCheckServiceTest.enqueueRun")(function* (
      companyId: string,
      reason: string,
      inputKey: string,
    ) {
      yield* Effect.sync(() => {
        enqueued.push({ companyId, reason, inputKey });
      });
      return "queued";
    }),
    setCheckOverride: (input) =>
      Effect.succeed({
        ...input,
        id: `${input.companyId}:${input.checkDefinitionId}:override`,
        updatedAt: sample.updatedAt,
      }),
    getGroups: () => Effect.succeed([]),
    runCheckEngine: (companyId, reason) =>
      Effect.succeed({
        id: `${companyId}:run`,
        companyId,
        status: "completed" as const,
        engineVersion: "test",
        inputHash: "test",
        reason,
        error: null,
        updatedAt: sample.updatedAt,
      }),
  }),
);

const TestLive = CompanyServiceLive.pipe(
  Layer.provide(Layer.mergeAll(TestRepoLive, TestCheckServiceLive)),
);

describe("CompanyService", () => {
  it.effect("creates sparse companies from a name", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;

      const company = yield* service.create({ name: "Bevel" });

      assert.strictEqual(company.name, "Bevel");
      assert.strictEqual(company.stage, "unknown");
      assert.strictEqual(company.score, null);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("upserts, lists, and gets companies", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;

      yield* service.upsert(sample);
      const companies = yield* service.list();
      const company = yield* service.get(sample.id);

      assert.strictEqual(companies.length, 1);
      assert.strictEqual(company.name, sample.name);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("fails when a company is missing", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      const result = yield* service.get("missing-company").pipe(
        Effect.catchTags({
          ErrorCompanyNotFound: (error) => Effect.succeed(error),
        }),
      );

      assert.instanceOf(result, ErrorCompanyNotFound);
      assert.strictEqual(result.id, "missing-company");
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("enqueues check engine workflow after source insight upsert", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      enqueued.splice(0, enqueued.length);

      yield* service.upsertSourceInsight({
        id: "deck-growth",
        companyId: sample.id,
        sourceId: "deck",
        kind: "excerpt",
        locator: "P7",
        text: "We reached $1.2M ARR with 22% MoM growth.",
        extractorVersion: "test-v1",
        insightWorkflowRunId: "test-run",
        order: 10,
        updatedAt: sample.updatedAt,
      });

      assert.strictEqual(enqueued.length, 1);
      assert.deepStrictEqual(enqueued[0], {
        companyId: sample.id,
        reason: "source_insights_changed",
        inputKey: "deck-growth",
      });
    }).pipe(Effect.provide(TestLive)),
  );
});
