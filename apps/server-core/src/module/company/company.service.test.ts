import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { CompanyRepo } from "./company.repo";
import { CompanyService, CompanyServiceLive, ErrorCompanyNotFound } from "./company.service";
import type { Company } from "./company.schema";

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

const TestRepoLive = Layer.effect(
  CompanyRepo,
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<string, Company>());
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
    });
  }),
);

const TestLive = CompanyServiceLive.pipe(Layer.provide(TestRepoLive));

describe("CompanyService", () => {
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
});
