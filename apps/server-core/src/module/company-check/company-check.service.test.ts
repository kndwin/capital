import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { CompanyRepo } from "../company/company.repo";
import type { Company, CompanySourceInsight } from "../company/company.schema";
import { CompanyCheckEngineQueueNoopLive } from "./company-check.queue";
import { CompanyCheckRepo } from "./company-check.repo";
import { CompanyCheckService, CompanyCheckServiceLive } from "./company-check.service";
import type {
  CompanyCheck,
  CompanyCheckInsight,
  CompanyCheckOverride,
  CompanyCheckRun,
  CompanyEngineCheck,
} from "./company-check.schema";

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

const CompanyRepoTestLive = Layer.effect(
  CompanyRepo,
  Effect.gen(function* () {
    const companies = yield* Ref.make(new Map<string, Company>().set(sample.id, sample));
    const insights = yield* Ref.make(
      new Map<string, CompanySourceInsight>().set("deck-growth", {
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
      }),
    );
    return CompanyRepo.of({
      upsert: Effect.fn("CompanyRepoTest.upsert")(function* (input: Company) {
        yield* Ref.update(companies, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      get: Effect.fn("CompanyRepoTest.get")(function* (id: string) {
        return (yield* Ref.get(companies)).get(id);
      }),
      list: Effect.fn("CompanyRepoTest.list")(function* () {
        return Array.from((yield* Ref.get(companies)).values());
      }),
      upsertSource: (input) => Effect.succeed(input),
      upsertSourceInsight: Effect.fn("CompanyRepoTest.upsertSourceInsight")(function* (input) {
        yield* Ref.update(insights, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      listSources: () => Effect.succeed([]),
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

const CompanyCheckRepoTestLive = Layer.effect(
  CompanyCheckRepo,
  Effect.gen(function* () {
    const checks = yield* Ref.make(new Map<string, CompanyCheck>());
    const runs = yield* Ref.make(new Map<string, CompanyCheckRun>());
    const engineChecks = yield* Ref.make(new Map<string, CompanyEngineCheck>());
    const overrides = yield* Ref.make(new Map<string, CompanyCheckOverride>());
    const links = yield* Ref.make(new Map<string, CompanyCheckInsight>());
    return CompanyCheckRepo.of({
      upsertCheck: Effect.fn("CompanyCheckRepoTest.upsertCheck")(function* (input) {
        yield* Ref.update(checks, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      upsertCheckRun: Effect.fn("CompanyCheckRepoTest.upsertCheckRun")(function* (input) {
        yield* Ref.update(runs, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      upsertEngineCheck: Effect.fn("CompanyCheckRepoTest.upsertEngineCheck")(function* (input) {
        yield* Ref.update(engineChecks, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      upsertCheckOverride: Effect.fn("CompanyCheckRepoTest.upsertCheckOverride")(function* (input) {
        yield* Ref.update(overrides, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      upsertCheckInsight: Effect.fn("CompanyCheckRepoTest.upsertCheckInsight")(function* (input) {
        yield* Ref.update(links, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      listSeedChecks: Effect.fn("CompanyCheckRepoTest.listSeedChecks")(function* (companyId) {
        return Array.from((yield* Ref.get(checks)).values()).filter(
          (check) => check.companyId === companyId,
        );
      }),
      listEngineChecks: Effect.fn("CompanyCheckRepoTest.listEngineChecks")(function* (companyId) {
        return Array.from((yield* Ref.get(engineChecks)).values()).filter(
          (check) => check.companyId === companyId,
        );
      }),
      listCheckOverrides: Effect.fn("CompanyCheckRepoTest.listCheckOverrides")(
        function* (companyId) {
          return Array.from((yield* Ref.get(overrides)).values()).filter(
            (override) => override.companyId === companyId,
          );
        },
      ),
      listCheckInsights: Effect.fn("CompanyCheckRepoTest.listCheckInsights")(function* (companyId) {
        return Array.from((yield* Ref.get(links)).values()).filter(
          (link) => link.companyId === companyId,
        );
      }),
      findCompletedCheckRunByInputHash: Effect.fn(
        "CompanyCheckRepoTest.findCompletedCheckRunByInputHash",
      )(function* (companyId, inputHash) {
        return Array.from((yield* Ref.get(runs)).values()).find(
          (run) =>
            run.companyId === companyId &&
            run.inputHash === inputHash &&
            run.status === "completed",
        );
      }),
    });
  }),
);

const TestLive = CompanyCheckServiceLive.pipe(
  Layer.provide(
    Layer.mergeAll(CompanyCheckRepoTestLive, CompanyRepoTestLive, CompanyCheckEngineQueueNoopLive),
  ),
);

describe("CompanyCheckService", () => {
  it.effect("runs traction check engine and groups checks", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      yield* service.runCheckEngine(sample.id, "test");
      const groups = yield* service.getGroups(sample.id);

      assert.strictEqual(groups.length, 1);
      assert.strictEqual(groups[0]?.label, "Traction");
      assert.strictEqual(groups[0]?.checks.length, 2);
    }).pipe(Effect.provide(TestLive)),
  );
});
