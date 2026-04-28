import type { CompanySourceInsight } from "../../../company/company.schema";
import type { CompanyCheckDefinition, CompanyCheckJudgement } from "../../company-check.schema";
import { extractPercentValues } from "./traction.helpers";

export const growthRateCheck = {
  id: "traction.growth_rate",
  groupId: "traction",
  groupLabel: "Traction",
  label: "Growth rate",
  weight: 0.45,
  order: 20,
} satisfies CompanyCheckDefinition;

export function evaluateGrowthRateCheck({
  insights,
}: {
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  const growthInsights = insights.filter((insight) =>
    /\bMoM\b|month[- ]over[- ]month|growth|CAGR/i.test(insight.text),
  );
  if (growthInsights.length === 0) {
    return {
      status: "unknown",
      score: 0,
      detail: null,
      rationale: "No growth-rate evidence found in source insights.",
      insightIds: [],
    };
  }

  const rates = growthInsights.flatMap((insight) => extractPercentValues({ text: insight.text }));
  if (rates.length === 0) {
    return {
      status: "concern",
      score: 60,
      detail: "growth mentioned",
      rationale: "Growth is mentioned, but no percentage was extracted.",
      insightIds: growthInsights.map((insight) => insight.id),
    };
  }

  const max = Math.max(...rates);
  const min = Math.min(...rates);
  const detail = `${max}% MoM`;
  if (max >= 20 && max - min >= 8) {
    return {
      status: "concern",
      score: 60,
      detail,
      rationale: "Growth clears the target in one source, but other source insights conflict.",
      insightIds: growthInsights.map((insight) => insight.id),
    };
  }
  if (max >= 20) {
    return {
      status: "pass",
      score: 100,
      detail,
      rationale: "Growth evidence shows at least 20% month-over-month growth.",
      insightIds: growthInsights.map((insight) => insight.id),
    };
  }
  if (max >= 10) {
    return {
      status: "concern",
      score: 60,
      detail,
      rationale: "Growth evidence is positive but below the 20% month-over-month target.",
      insightIds: growthInsights.map((insight) => insight.id),
    };
  }
  return {
    status: "fail",
    score: 20,
    detail,
    rationale: "Growth evidence is below the traction threshold.",
    insightIds: growthInsights.map((insight) => insight.id),
  };
}
