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
      return evaluateRemainingTractionCheck({ definition, insights });
  }
}

function evaluateRemainingTractionCheck({
  definition,
  insights,
}: {
  readonly definition: CompanyCheckDefinition;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  const keywords = tractionEvidenceKeywords[definition.id];
  if (!keywords) {
    return {
      status: "unknown",
      score: 0,
      detail: null,
      rationale: "No evaluator is registered for this check definition.",
      insightIds: [],
    };
  }

  const matchingInsights = insights.filter((insight) =>
    keywords.some((keyword) => keyword.test(insight.text)),
  );
  if (matchingInsights.length === 0) {
    return {
      status: "unknown",
      score: 0,
      detail: null,
      rationale: `No ${definition.label.toLowerCase()} evidence found in source insights.`,
      insightIds: [],
    };
  }

  const negativeMatches = matchingInsights.filter((insight) =>
    tractionRiskEvidence.test(insight.text),
  );
  if (negativeMatches.length > 0) {
    return {
      status: "fail",
      score: 20,
      detail: `${negativeMatches.length} risk signal${negativeMatches.length === 1 ? "" : "s"}`,
      rationale: `${definition.label} has explicit risk evidence in source insights.`,
      insightIds: negativeMatches.map((insight) => insight.id),
    };
  }

  return {
    status: matchingInsights.length >= 2 ? "pass" : "concern",
    score: matchingInsights.length >= 2 ? 100 : 60,
    detail: `${matchingInsights.length} supporting insight${matchingInsights.length === 1 ? "" : "s"}`,
    rationale:
      matchingInsights.length >= 2
        ? `${definition.label} is supported by multiple source insights.`
        : `${definition.label} has supporting evidence, but needs more corroboration.`,
    insightIds: matchingInsights.map((insight) => insight.id),
  };
}

const tractionRiskEvidence =
  /\b(concentration|churn|declin(?:e|ing)|flat|shrinking|burn|runway under|less than|below|negative|low margin)\b/i;

const tractionEvidenceKeywords: Readonly<Record<string, ReadonlyArray<RegExp>>> = {
  "traction.gross_margin": [/\bgross margin\b/i, /\bGM\b/i, /\bmargin\b/i],
  "traction.burn_runway": [/\bburn\b/i, /\brunway\b/i, /\bcash runway\b/i, /\bmonths runway\b/i],
  "traction.customer_concentration": [
    /\bcustomer concentration\b/i,
    /\btop customer\b/i,
    /\blargest customer\b/i,
    /\benterprise customers\b/i,
  ],
  "traction.net_retention": [
    /\bnet retention\b/i,
    /\bNRR\b/i,
    /\bGRR\b/i,
    /\bgross retention\b/i,
    /\bexpansion revenue\b/i,
  ],
};
