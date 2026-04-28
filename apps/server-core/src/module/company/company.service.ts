import { Clock, Context, Effect, Layer } from "effect";
import { CompanyCheckService } from "../company-check/company-check.service";
import { ErrorCompanyNotFound } from "./company.error";
import { CompanyRepo } from "./company.repo";
import type {
  Company,
  CompanyDetail,
  CompanyCreateInput,
  CompanySource,
  CompanySourceInsight,
} from "./company.schema";
import { toCompanyId } from "./company.util";

const withModuleLogs = Effect.annotateLogs({ module: "company" });

export class CompanyService extends Context.Service<CompanyService>()("module/CompanyService", {
  make: Effect.gen(function* () {
    const repo = yield* CompanyRepo;
    const companyCheck = yield* CompanyCheckService;

    const create = Effect.fn("CompanyService.create")(function* (input: CompanyCreateInput) {
      const now = yield* Clock.currentTimeMillis;
      const company: Company = {
        id: `${toCompanyId({ name: input.name })}-${now}`,
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

    const upsertSource = Effect.fn("CompanyService.upsertSource")(function* (input: CompanySource) {
      return yield* repo.upsertSource(input);
    }, withModuleLogs);

    const upsertSourceInsight = Effect.fn("CompanyService.upsertSourceInsight")(function* (
      input: CompanySourceInsight,
    ) {
      const insight = yield* repo.upsertSourceInsight(input);
      yield* companyCheck.enqueueRun(input.companyId, "source_insights_changed", input.id);
      return insight;
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

    const getDetail = Effect.fn("CompanyService.getDetail")(function* (id: string) {
      yield* Effect.annotateCurrentSpan({ "company.id": id });
      const company = yield* get(id);
      const sources = yield* repo.listSources(id);
      const insights = yield* repo.listSourceInsights(id);
      const checkGroups = yield* companyCheck.getGroups(id);
      return {
        company,
        checkGroups,
        sources,
        insights,
      } satisfies CompanyDetail;
    }, withModuleLogs);

    return {
      create,
      upsert,
      upsertSource,
      upsertSourceInsight,
      get,
      getDetail,
      list,
    } as const;
  }),
}) {}

export const CompanyServiceLive = Layer.effect(CompanyService, CompanyService.make);
