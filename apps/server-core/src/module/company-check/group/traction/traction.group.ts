import type { CompanySourceInsight } from "../../../company/company.schema";
import type { CompanyCheckDefinition, CompanyCheckJudgement } from "../../company-check.schema";
import { arrCheck, evaluateArrCheck } from "./arr.check";
import { evaluateGrowthRateCheck, growthRateCheck } from "./growth-rate.check";

export type CompanyCheckGroupDefinition = {
  readonly id: string;
  readonly label: string;
  readonly checks: ReadonlyArray<CompanyCheckDefinition>;
};

export const tractionGroup = {
  id: "traction",
  label: "Traction",
  checks: [arrCheck, growthRateCheck],
} satisfies CompanyCheckGroupDefinition;

export function evaluateTractionCheck({
  definition,
  insights,
}: {
  readonly definition: CompanyCheckDefinition;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  switch (definition.id) {
    case arrCheck.id:
      return evaluateArrCheck({ insights });
    case growthRateCheck.id:
      return evaluateGrowthRateCheck({ insights });
    default:
      return {
        status: "unknown",
        score: 0,
        detail: null,
        rationale: "No evaluator is registered for this check definition.",
        insightIds: [],
      };
  }
}
