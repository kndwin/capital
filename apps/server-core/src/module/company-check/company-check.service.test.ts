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

let lastUpsertedCompany: Company | undefined;

function getLastUpsertedCompany() {
  return lastUpsertedCompany;
}

const CompanyRepoTestLive = Layer.effect(
  CompanyRepo,
  Effect.gen(function* () {
    const companies = yield* Ref.make(new Map<string, Company>().set(sample.id, sample));
    const insights = yield* Ref.make(
      new Map<string, CompanySourceInsight>([
        [
          "deck-growth",
          {
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
          },
        ],
        [
          "deck-market",
          {
            id: "deck-market",
            companyId: sample.id,
            sourceId: "deck",
            kind: "excerpt",
            locator: "P4",
            text: "The company targets a $12B TAM with strong market growth tailwinds.",
            extractorVersion: "test-v1",
            insightWorkflowRunId: "test-run",
            order: 20,
            updatedAt: sample.updatedAt,
          },
        ],
      ]),
    );
    return CompanyRepo.of({
      upsert: Effect.fn("CompanyRepoTest.upsert")(function* (input: Company) {
        lastUpsertedCompany = input;
        yield* Ref.update(companies, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      get: Effect.fn("CompanyRepoTest.get")(function* (id: string) {
        return (yield* Ref.get(companies)).get(id);
      }),
      delete: Effect.fn("CompanyRepoTest.delete")(function* (id: string) {
        yield* Ref.update(companies, (items) => {
          const next = new Map(items);
          next.delete(id);
          return next;
        });
      }),
      list: Effect.fn("CompanyRepoTest.list")(function* () {
        return Array.from((yield* Ref.get(companies)).values());
      }),
      getApplicationInviteByTokenHash: () => Effect.succeed(undefined),
      createApplicationInvite: () => Effect.void,
      markApplicationInviteUsed: () => Effect.void,
      upsertSource: (input) => Effect.succeed(input),
      getSource: () => Effect.succeed(undefined),
      getSourceAcquiredText: () => Effect.succeed(null),
      updateSourceStatus: () => Effect.void,
      updateSourceAcquiredContent: () => Effect.void,
      nextSourceOrder: () => Effect.succeed(10),
      createWatchTarget: (input) => Effect.succeed(input),
      updateWatchTargetScan: () => Effect.void,
      listWatchTargets: () => Effect.succeed([]),
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
    const links = yield* Ref.make(
      new Map<string, CompanyCheckInsight>([
        [
          "sample-company:traction.arr:stale-insight",
          {
            id: "sample-company:traction.arr:stale-insight",
            companyId: sample.id,
            checkDefinitionId: "traction.arr",
            insightId: "stale-insight",
            runId: "stale-run",
            relationship: "supports",
            updatedAt: sample.updatedAt - 1,
          },
        ],
      ]),
    );
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
      deleteCheckInsights: Effect.fn("CompanyCheckRepoTest.deleteCheckInsights")(
        function* (companyId) {
          yield* Ref.update(links, (items) => {
            const next = new Map(items);
            for (const [id, link] of next) {
              if (link.companyId === companyId) next.delete(id);
            }
            return next;
          });
        },
      ),
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
  it.effect("returns definition groups before the engine runs", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      const groups = yield* service.getGroups(sample.id);

      assert.strictEqual(groups.length, 5);
      assert.strictEqual(
        groups.reduce((count, group) => count + group.checks.length, 0),
        23,
      );
      assert.strictEqual(groups[0]?.score, null);
      assert.strictEqual(groups[0]?.checks[0]?.source, "definition");
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("runs traction check engine and groups checks", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      yield* service.runCheckEngine(sample.id, "test");
      const groups = yield* service.getGroups(sample.id);

      assert.strictEqual(groups.length, 5);
      assert.strictEqual(groups[3]?.label, "Traction & Financials");
      assert.strictEqual(groups[3]?.checks.length, 6);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("updates company score when pitch deck insights match checks", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      lastUpsertedCompany = undefined;
      yield* service.runCheckEngine(sample.id, "test");
      const groups = yield* service.getGroups(sample.id);
      const company = getLastUpsertedCompany();

      assert.strictEqual(company?.score, 73);
      assert.strictEqual(company?.riskLevel, "medium");
      assert.strictEqual(groups.find((group) => group.id === "market")?.score, 60);
      assert.strictEqual(groups.find((group) => group.id === "traction")?.score, 100);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("returns supporting insight links immediately after a fresh engine run", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      yield* service.runCheckEngine(sample.id, "test");
      const groups = yield* service.getGroups(sample.id);
      const tractionChecks = groups.find((group) => group.id === "traction")?.checks ?? [];

      assert.deepStrictEqual(
        tractionChecks.find((check) => check.checkDefinitionId === "traction.arr")
          ?.supportingInsightIds,
        ["deck-growth"],
      );
      assert.deepStrictEqual(
        tractionChecks.find((check) => check.checkDefinitionId === "traction.growth_rate")
          ?.supportingInsightIds,
        ["deck-growth", "deck-market"],
      );
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("removes stale supporting insight links when replacing check evidence", () =>
    Effect.gen(function* () {
      const service = yield* CompanyCheckService;

      yield* service.runCheckEngine(sample.id, "test");
      const groups = yield* service.getGroups(sample.id);
      const arrCheck = groups
        .find((group) => group.id === "traction")
        ?.checks.find((check) => check.checkDefinitionId === "traction.arr");

      assert.deepStrictEqual(arrCheck?.supportingInsightIds, ["deck-growth"]);
    }).pipe(Effect.provide(TestLive)),
  );
});
