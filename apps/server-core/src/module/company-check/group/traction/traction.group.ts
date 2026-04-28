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
  label: "Traction & Financials",
  checks: [
    { ...arrCheck, groupLabel: "Traction & Financials", label: "Revenue scale", order: 310 },
    { ...growthRateCheck, groupLabel: "Traction & Financials", order: 320 },
    {
      id: "traction.gross_margin",
      groupId: "traction",
      groupLabel: "Traction & Financials",
      label: "Gross margin",
      weight: 1,
      order: 330,
    },
    {
      id: "traction.burn_runway",
      groupId: "traction",
      groupLabel: "Traction & Financials",
      label: "Burn rate & runway",
      weight: 1,
      order: 340,
    },
    {
      id: "traction.customer_concentration",
      groupId: "traction",
      groupLabel: "Traction & Financials",
      label: "Customer concentration",
      weight: 1,
      order: 350,
    },
    {
      id: "traction.net_retention",
      groupId: "traction",
      groupLabel: "Traction & Financials",
      label: "Net retention",
      weight: 1,
      order: 360,
    },
  ],
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
