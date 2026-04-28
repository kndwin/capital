import { Clock, Context, Effect, Layer, Schema } from "effect";
import { CompanyRepo } from "./company.repo";
import type { Company, CompanyCreateInput } from "./company.schema";

const withModuleLogs = Effect.annotateLogs({ module: "company" });

export class ErrorCompanyNotFound extends Schema.TaggedErrorClass<ErrorCompanyNotFound>()(
  "ErrorCompanyNotFound",
  { id: Schema.String },
) {}

export class CompanyService extends Context.Service<CompanyService>()("module/CompanyService", {
  make: Effect.gen(function* () {
    const repo = yield* CompanyRepo;

    const create = Effect.fn("CompanyService.create")(function* (input: CompanyCreateInput) {
      const now = yield* Clock.currentTimeMillis;
      const company: Company = {
        id: `${toCompanyId(input.name)}-${now}`,
        name: input.name,
        description: null,
        website: null,
        stage: "unknown",
        sector: null,
        location: null,
        score: null,
        riskLevel: "unknown",
        updatedAt: now,
      };
      yield* Effect.annotateCurrentSpan({ "company.id": company.id });
      const created = yield* repo.upsert(company);
      yield* Effect.logInfo("company.created");
      return created;
    }, withModuleLogs);

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

    return { create, upsert, get, list } as const;
  }),
}) {}

export const CompanyServiceLive = Layer.effect(CompanyService, CompanyService.make);

function toCompanyId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "company";
}
