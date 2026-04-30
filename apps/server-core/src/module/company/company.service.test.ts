import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanySourceIngestQueue } from "./company-source.queue";
import { ErrorCompanyNotFound } from "./company.error";
import { CompanyRepo } from "./company.repo";
import { CompanyService, CompanyServiceLive } from "./company.service";
import type {
  Company,
  CompanySource,
  CompanySourceInsight,
  CompanyWatchTarget,
} from "./company.schema";

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

const sourceEnqueued: Array<{
  readonly companyId: string;
  readonly sourceId: string;
  readonly reason: string;
}> = [];

const TestRepoLive = Layer.effect(
  CompanyRepo,
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<string, Company>());
    const sources = yield* Ref.make(new Map<string, CompanySource>());
    const insights = yield* Ref.make(new Map<string, CompanySourceInsight>());
    const watchTargets = yield* Ref.make(new Map<string, CompanyWatchTarget>());
    const invites = yield* Ref.make(
      new Map<
        string,
        {
          readonly id: string;
          readonly tokenHash: string;
          readonly status: "open" | "used";
          readonly expiresAt: number;
          readonly submittedCompanyId: string | null;
        }
      >(),
    );
    return CompanyRepo.of({
      upsert: Effect.fn("CompanyRepoTest.upsert")(function* (input: Company) {
        yield* Ref.update(store, (companies) => new Map(companies).set(input.id, input));
        return input;
      }),
      get: Effect.fn("CompanyRepoTest.get")(function* (id: string) {
        return (yield* Ref.get(store)).get(id);
      }),
      delete: Effect.fn("CompanyRepoTest.delete")(function* (id: string) {
        yield* Ref.update(store, (companies) => {
          const next = new Map(companies);
          next.delete(id);
          return next;
        });
        yield* Ref.update(sources, (items) => {
          const next = new Map(items);
          for (const [sourceId, source] of next) {
            if (source.companyId === id) next.delete(sourceId);
          }
          return next;
        });
        yield* Ref.update(insights, (items) => {
          const next = new Map(items);
          for (const [insightId, insight] of next) {
            if (insight.companyId === id) next.delete(insightId);
          }
          return next;
        });
      }),
      list: Effect.fn("CompanyRepoTest.list")(function* () {
        return Array.from((yield* Ref.get(store)).values());
      }),
      getApplicationInviteByTokenHash: Effect.fn("CompanyRepoTest.getApplicationInviteByTokenHash")(
        function* (tokenHash: string) {
          return Array.from((yield* Ref.get(invites)).values()).find(
            (invite) => invite.tokenHash === tokenHash,
          );
        },
      ),
      createApplicationInvite: Effect.fn("CompanyRepoTest.createApplicationInvite")(
        function* (input) {
          yield* Ref.update(invites, (items) =>
            new Map(items).set(input.id, {
              id: input.id,
              tokenHash: input.tokenHash,
              status: "open",
              expiresAt: input.expiresAt,
              submittedCompanyId: null,
            }),
          );
        },
      ),
      markApplicationInviteUsed: Effect.fn("CompanyRepoTest.markApplicationInviteUsed")(
        function* (input) {
          yield* Ref.update(invites, (items) => {
            const invite = items.get(input.id);
            if (!invite) return items;
            return new Map(items).set(input.id, {
              ...invite,
              status: "used",
              submittedCompanyId: input.companyId,
            });
          });
        },
      ),
      upsertSource: Effect.fn("CompanyRepoTest.upsertSource")(function* (input: CompanySource) {
        yield* Ref.update(sources, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      getSource: Effect.fn("CompanyRepoTest.getSource")(function* (id: string) {
        return (yield* Ref.get(sources)).get(id);
      }),
      getSourceAcquiredText: () => Effect.succeed(null),
      updateSourceStatus: () => Effect.void,
      updateSourceAcquiredContent: () => Effect.void,
      nextSourceOrder: () => Effect.succeed(10),
      createWatchTarget: Effect.fn("CompanyRepoTest.createWatchTarget")(function* (
        input: CompanyWatchTarget,
      ) {
        yield* Ref.update(watchTargets, (items) => new Map(items).set(input.id, input));
        return input;
      }),
      updateWatchTargetScan: Effect.fn("CompanyRepoTest.updateWatchTargetScan")(function* (input) {
        yield* Ref.update(watchTargets, (items) => {
          const existing = items.get(input.id);
          if (!existing) return items;
          return new Map(items).set(input.id, {
            ...existing,
            status: input.status,
            lastScannedAt: input.lastScannedAt,
            lastMatchedAt: input.lastMatchedAt,
            error: input.error,
            updatedAt: input.lastScannedAt,
          });
        });
      }),
      listWatchTargets: Effect.fn("CompanyRepoTest.listWatchTargets")(function* (
        companyId: string,
      ) {
        return Array.from((yield* Ref.get(watchTargets)).values()).filter(
          (target) => target.companyId === companyId,
        );
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
  Layer.provide(
    Layer.mergeAll(
      TestRepoLive,
      TestCheckServiceLive,
      Layer.succeed(
        CompanySourceIngestQueue,
        CompanySourceIngestQueue.of({
          enqueue: Effect.fn("CompanySourceIngestQueueTest.enqueue")(function* (input) {
            yield* Effect.sync(() => {
              sourceEnqueued.push(input);
            });
            return "queued";
          }),
        }),
      ),
    ),
  ),
);

describe("CompanyService", () => {
  it.effect("creates companies from a name and url with initial sourcing", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      sourceEnqueued.splice(0, sourceEnqueued.length);

      const company = yield* service.create({
        name: "Bevel",
        url: "https://bevel.example",
      });
      const detail = yield* service.getDetail(company.id);

      assert.strictEqual(company.name, "Bevel");
      assert.strictEqual(company.website, "https://bevel.example");
      assert.strictEqual(company.stage, "unknown");
      assert.strictEqual(company.score, null);
      assert.strictEqual(detail.sources.length, 3);
      assert.deepStrictEqual(
        detail.sources.map((source) => source.title),
        ["Company website", "Market research", "Founder research"],
      );
      assert.strictEqual(sourceEnqueued.length, 3);
      assert.ok(sourceEnqueued.every((item) => item.companyId === company.id));
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("creates stealth companies from a blank name", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      sourceEnqueued.splice(0, sourceEnqueued.length);

      const company = yield* service.create({
        name: "",
        url: "https://stealth.example",
      });
      const detail = yield* service.getDetail(company.id);

      assert.strictEqual(company.name, "Stealth company");
      assert.strictEqual(company.website, "https://stealth.example");
      assert.strictEqual(detail.sources.length, 3);
      assert.strictEqual(sourceEnqueued.length, 3);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("creates watched websites for a company detail", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      yield* service.upsert(sample);

      const target = yield* service.createWatchTarget({
        companyId: sample.id,
        kind: "web_page",
        title: "Changelog",
        locator: "https://sample.example/changelog",
      });
      const detail = yield* service.getDetail(sample.id);

      assert.strictEqual(target.status, "active");
      assert.strictEqual(target.kind, "web_page");
      assert.strictEqual(target.locator, "https://sample.example/changelog");
      assert.strictEqual(target.title, "Changelog");
      assert.strictEqual(target.lastScannedAt, null);
      assert.deepStrictEqual(
        detail.watchTargets.map((item) => item.target.url),
        ["https://sample.example/changelog"],
      );
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("normalizes watched X profiles", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      yield* service.upsert(sample);

      const target = yield* service.createWatchTarget({
        companyId: sample.id,
        kind: "x_profile",
        title: "Company X",
        locator: "https://x.com/sampleco/status/123",
      });

      assert.strictEqual(target.kind, "x_profile");
      assert.strictEqual(target.locator, "sampleco");
      assert.strictEqual(target.url, "https://x.com/sampleco");
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("submits applications with initial sourcing and application sources", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      sourceEnqueued.splice(0, sourceEnqueued.length);
      const createdInvite = yield* service.createApplicationInvite({ expiresInDays: 14 });
      const result = yield* service.submitApplication({
        token: createdInvite.token,
        name: "Submitted Co",
        website: "https://submitted.example",
        description: "Founder-submitted company.",
        product: "Workflow automation for operators.",
        customer: "Mid-market finance teams.",
        traction: "$100k ARR and 12 customers.",
        fundraise: "Raising seed.",
        notes: "Reference calls available.",
        links: [{ title: "Deck", url: "https://submitted.example/deck" }],
        files: [{ fileName: "deck.pdf", contentBase64: Buffer.from("pdf").toString("base64") }],
      });
      const detail = yield* service.getDetail(result.companyId);

      assert.strictEqual(detail.company.name, "Submitted Co");
      assert.deepStrictEqual(
        detail.sources.map((source) => source.title),
        [
          "Company website",
          "Market research",
          "Founder research",
          "Founder application",
          "Deck",
          "deck.pdf",
        ],
      );
      assert.strictEqual(sourceEnqueued.length, 6);
    }).pipe(Effect.provide(TestLive)),
  );

  it.effect("creates AI research sources from a prompt", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      sourceEnqueued.splice(0, sourceEnqueued.length);
      yield* service.upsert(sample);

      const created = yield* service.createSource({
        companyId: sample.id,
        kind: "chat",
        prompt: "Find recent traction, customers, competitors, and founder background.",
        title: null,
      });

      assert.strictEqual(created.kind, "chat");
      assert.strictEqual(created.title, "Sample Company AI research");
      assert.strictEqual(
        created.subtitle,
        "Find recent traction, customers, competitors, and founder background.",
      );
      assert.strictEqual(sourceEnqueued.length, 1);
      assert.strictEqual(sourceEnqueued[0]?.sourceId, created.id);
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

  it.effect("updates editable company fields and preserves score", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;

      yield* service.upsert(sample);
      const company = yield* service.update({
        id: sample.id,
        name: "Updated Company",
        description: null,
        website: "https://updated.example",
        stage: "series_a",
        sector: "AI Infrastructure",
        location: "New York, NY",
        riskLevel: "low",
      });

      assert.strictEqual(company.name, "Updated Company");
      assert.strictEqual(company.description, null);
      assert.strictEqual(company.website, "https://updated.example");
      assert.strictEqual(company.stage, "series_a");
      assert.strictEqual(company.sector, "AI Infrastructure");
      assert.strictEqual(company.location, "New York, NY");
      assert.strictEqual(company.riskLevel, "low");
      assert.strictEqual(company.score, sample.score);
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

  it.effect("fails when updating a missing company", () =>
    Effect.gen(function* () {
      const service = yield* CompanyService;
      const result = yield* service
        .update({
          id: "missing-company",
          name: "Missing",
          description: null,
          website: null,
          stage: "unknown",
          sector: null,
          location: null,
          riskLevel: "unknown",
        })
        .pipe(
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
