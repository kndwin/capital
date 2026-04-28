import { Clock, Context, Effect, Layer } from "effect";
import { ErrorCompanyNotFound } from "../company/company.error";
import { CompanyRepo } from "../company/company.repo";
import type {
  CompanyCheck,
  CompanyCheckOverride,
  CompanyCheckOverrideSetInput,
  CompanyCheckRun,
} from "./company-check.schema";
import type { CompanyCheckInsight } from "./company-check.schema";
import { CompanyCheckEngineQueue } from "./company-check.queue";
import { CompanyCheckRepo } from "./company-check.repo";
import {
  applyOverrides,
  calculateWeightedScore,
  getDefinitionChecks,
  evaluateCheck,
  getCheckDefinitions,
  groupChecks,
  hashCheckEngineInput,
  mergeDefinitionChecks,
  toEngineCheck,
} from "./company-check.util";

const withModuleLogs = Effect.annotateLogs({ module: "company-check" });
const checkEngineVersion = "traction-check-engine-v1";

export class CompanyCheckService extends Context.Service<CompanyCheckService>()(
  "module/CompanyCheckService",
  {
    make: Effect.gen(function* () {
      const companyRepo = yield* CompanyRepo;
      const checkRepo = yield* CompanyCheckRepo;
      const checkEngineQueue = yield* CompanyCheckEngineQueue;

      const upsertCheck = Effect.fn("CompanyCheckService.upsertCheck")(function* (
        input: CompanyCheck,
      ) {
        return yield* checkRepo.upsertCheck(input);
      }, withModuleLogs);

      const upsertCheckOverride = Effect.fn("CompanyCheckService.upsertCheckOverride")(function* (
        input: CompanyCheckOverride,
      ) {
        return yield* checkRepo.upsertCheckOverride(input);
      }, withModuleLogs);

      const enqueueRun = Effect.fn("CompanyCheckService.enqueueRun")(function* (
        companyId: string,
        reason: string,
        inputKey: string,
      ) {
        return yield* checkEngineQueue.enqueue({ companyId, reason, inputKey });
      }, withModuleLogs);

      const setCheckOverride = Effect.fn("CompanyCheckService.setCheckOverride")(function* (
        input: CompanyCheckOverrideSetInput,
      ) {
        const now = yield* Clock.currentTimeMillis;
        const override = yield* checkRepo.upsertCheckOverride({
          id: `${input.companyId}:${input.checkDefinitionId}:override`,
          companyId: input.companyId,
          checkDefinitionId: input.checkDefinitionId,
          status: input.status,
          score: input.score,
          detail: input.detail,
          rationale: input.rationale,
          createdByUserId: input.createdByUserId,
          updatedAt: now,
        });
        yield* runCheckEngine(input.companyId, "override_changed");
        return override;
      }, withModuleLogs);

      const getGroups = Effect.fn("CompanyCheckService.getGroups")(function* (companyId: string) {
        const seedChecks = yield* checkRepo.listSeedChecks(companyId);
        const engineChecks = yield* checkRepo.listEngineChecks(companyId);
        const overrides = yield* checkRepo.listCheckOverrides(companyId);
        const checkInsights = yield* checkRepo.listCheckInsights(companyId);
        const now = yield* Clock.currentTimeMillis;
        const definitionChecks = getDefinitionChecks({ companyId, updatedAt: now });
        const effectiveChecks =
          engineChecks.length > 0
            ? mergeDefinitionChecks({
                definitions: definitionChecks,
                checks: applyOverrides({ engineChecks, overrides, links: checkInsights }),
              })
            : seedChecks.length > 0
              ? mergeDefinitionChecks({ definitions: definitionChecks, checks: seedChecks })
              : definitionChecks;
        return groupChecks({ checks: effectiveChecks });
      }, withModuleLogs);

      const runCheckEngine = Effect.fn("CompanyCheckService.runCheckEngine")(function* (
        companyId: string,
        reason: string,
      ) {
        yield* Effect.annotateCurrentSpan({ "company.id": companyId });
        const company = yield* companyRepo.get(companyId);
        if (!company) return yield* new ErrorCompanyNotFound({ id: companyId });

        const insights = yield* companyRepo.listSourceInsights(companyId);
        const inputHash = hashCheckEngineInput({
          companyId,
          engineVersion: checkEngineVersion,
          insights,
        });
        const existingRun = yield* checkRepo.findCompletedCheckRunByInputHash(companyId, inputHash);
        if (existingRun) {
          const engineChecks = yield* checkRepo.listEngineChecks(companyId);
          const overrides = yield* checkRepo.listCheckOverrides(companyId);
          const checkInsights = yield* checkRepo.listCheckInsights(companyId);
          const effectiveChecks = applyOverrides({ engineChecks, overrides, links: checkInsights });
          const score = calculateWeightedScore({ checks: effectiveChecks });
          yield* companyRepo.upsert({
            ...company,
            score,
            riskLevel:
              score === null ? "unknown" : score >= 80 ? "low" : score >= 55 ? "medium" : "high",
          });
          return existingRun;
        }

        const now = yield* Clock.currentTimeMillis;
        const run: CompanyCheckRun = {
          id: `${companyId}-${inputHash.slice(0, 12)}`,
          companyId,
          status: "running",
          engineVersion: checkEngineVersion,
          inputHash,
          reason,
          error: null,
          updatedAt: now,
        };
        yield* checkRepo.upsertCheckRun(run);

        const results = getCheckDefinitions({ _: undefined }).map((definition) => {
          const judgement = evaluateCheck({ definition, insights });
          return {
            judgement,
            check: toEngineCheck({
              companyId,
              definition,
              engineVersion: checkEngineVersion,
              judgement,
              runId: run.id,
              inputHash,
              updatedAt: now,
            }),
          };
        });
        const checks = results.map((result) => result.check);
        for (const check of checks) {
          yield* checkRepo.upsertEngineCheck(check);
        }
        for (const link of results.flatMap(({ check, judgement }) =>
          judgement.insightIds.map(
            (insightId): CompanyCheckInsight => ({
              id: `${check.id}:${insightId}`,
              companyId,
              checkDefinitionId: check.checkDefinitionId,
              insightId,
              runId: run.id,
              relationship: check.status === "fail" ? "conflicts" : "supports",
              updatedAt: now,
            }),
          ),
        )) {
          yield* checkRepo.upsertCheckInsight(link);
        }

        const overrides = yield* checkRepo.listCheckOverrides(companyId);
        const effectiveChecks = applyOverrides({ engineChecks: checks, overrides, links: [] });
        const score = calculateWeightedScore({ checks: effectiveChecks });
        yield* companyRepo.upsert({
          ...company,
          score,
          riskLevel:
            score === null ? "unknown" : score >= 80 ? "low" : score >= 55 ? "medium" : "high",
        });

        const completedRun: CompanyCheckRun = { ...run, status: "completed", updatedAt: now };
        yield* checkRepo.upsertCheckRun(completedRun);
        yield* Effect.logInfo("company_check.engine.completed");
        return completedRun;
      }, withModuleLogs);

      return {
        upsertCheck,
        upsertCheckOverride,
        enqueueRun,
        setCheckOverride,
        getGroups,
        runCheckEngine,
      } as const;
    }),
  },
) {}

export const CompanyCheckServiceLive = Layer.effect(CompanyCheckService, CompanyCheckService.make);
