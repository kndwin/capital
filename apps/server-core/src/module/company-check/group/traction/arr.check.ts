import type { CompanySourceInsight } from "../../../company/company.schema";
import type { CompanyCheckDefinition, CompanyCheckJudgement } from "../../company-check.schema";
import { extractMoneyValues, formatMoney } from "./traction.helpers";

export const arrCheck = {
  id: "traction.arr",
  groupId: "traction",
  groupLabel: "Traction",
  label: "ARR",
  weight: 0.55,
  order: 10,
} satisfies CompanyCheckDefinition;

export function evaluateArrCheck({
  insights,
}: {
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  const arrInsights = insights.filter((insight) =>
    /\bARR\b|annual recurring revenue/i.test(insight.text),
  );
  if (arrInsights.length === 0) {
    return {
      status: "unknown",
      score: 0,
      detail: null,
      rationale: "No ARR evidence found in source insights.",
      insightIds: [],
    };
  }

  const values = arrInsights.flatMap((insight) => extractMoneyValues({ text: insight.text }));
  if (values.length === 0) {
    return {
      status: "concern",
      score: 60,
      detail: "ARR mentioned",
      rationale: "ARR is mentioned, but no normalized dollar value was extracted.",
      insightIds: arrInsights.map((insight) => insight.id),
    };
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const detail = formatMoney({ value: max });
  if (max >= 1_000_000 && min > 0 && max / min >= 1.5) {
    return {
      status: "concern",
      score: 60,
      detail,
      rationale:
        "ARR clears the target threshold, but source insights contain materially different values.",
      insightIds: arrInsights.map((insight) => insight.id),
    };
  }
  if (max >= 1_000_000) {
    return {
      status: "pass",
      score: 100,
      detail,
      rationale: "ARR evidence indicates at least $1M ARR.",
      insightIds: arrInsights.map((insight) => insight.id),
    };
  }
  return {
    status: "concern",
    score: 60,
    detail,
    rationale: "ARR evidence exists but is below the $1M target threshold.",
    insightIds: arrInsights.map((insight) => insight.id),
  };
}
