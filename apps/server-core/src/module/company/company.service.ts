import { Context, Effect, Layer, Schema } from "effect";
import { CompanyRepo } from "./company.repo";
import type { Company } from "./company.schema";

const withModuleLogs = Effect.annotateLogs({ module: "company" });

export class ErrorCompanyNotFound extends Schema.TaggedErrorClass<ErrorCompanyNotFound>()(
  "ErrorCompanyNotFound",
  { id: Schema.String },
) {}

export class CompanyService extends Context.Service<CompanyService>()("module/CompanyService", {
  make: Effect.gen(function* () {
    const repo = yield* CompanyRepo;

    const upsert = Effect.fn("CompanyService.upsert")(function* (input: Company) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.id });
      const company = yield* repo.upsert(input);
      yield* Effect.logInfo("company.upserted");
      return company;
    }, withModuleLogs);

    const get = Effect.fn("CompanyService.get")(function* (id: string) {
      yield* Effect.annotateCurrentSpan({ "company.id": id });
      const company = yield* repo.get(id);
      if (!company) return yield* new ErrorCompanyNotFound({ id });
      return company;
    }, withModuleLogs);

    const list = Effect.fn("CompanyService.list")(function* () {
      return yield* repo.list();
    }, withModuleLogs);

    return { upsert, get, list } as const;
  }),
}) {}

export const CompanyServiceLive = Layer.effect(CompanyService, CompanyService.make);
