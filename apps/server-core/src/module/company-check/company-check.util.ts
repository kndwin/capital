import type { CompanySourceInsight } from "../company/company.schema";
import type {
  CompanyCheck,
  CompanyCheckDefinition,
  CompanyCheckGroup,
  CompanyCheckGroupVerdict,
  CompanyCheckInsight,
  CompanyCheckJudgement,
  CompanyCheckOverride,
  CompanyEngineCheck,
} from "./company-check.schema";
import { dealRiskGroup } from "./group/deal-risk/deal-risk.group";
import { marketGroup } from "./group/market/market.group";
import { productGroup } from "./group/product/product.group";
import { teamGroup } from "./group/team/team.group";
import { evaluateTractionCheck, tractionGroup } from "./group/traction/traction.group";

export function getCheckDefinitions({
  _,
}: {
  readonly _: undefined;
}): ReadonlyArray<CompanyCheckDefinition> {
  return _ === undefined
    ? [teamGroup, marketGroup, productGroup, tractionGroup, dealRiskGroup].flatMap(
        (group) => group.checks,
      )
    : [];
}

export function getDefinitionChecks({
  companyId,
  updatedAt,
}: {
  readonly companyId: string;
  readonly updatedAt: number;
}): ReadonlyArray<CompanyCheck> {
  return getCheckDefinitions({ _: undefined }).map((definition) => ({
    id: `${companyId}:${definition.id}:definition`,
    companyId,
    checkDefinitionId: definition.id,
    groupId: definition.groupId,
    groupLabel: definition.groupLabel,
    label: definition.label,
    status: "unknown",
    score: 0,
    detail: null,
    rationale: "Not evaluated yet.",
    source: "definition",
    overrideId: null,
    supportingInsightIds: [],
    order: definition.order,
    updatedAt,
  }));
}

export function mergeDefinitionChecks({
  definitions,
  checks,
}: {
  readonly definitions: ReadonlyArray<CompanyCheck>;
  readonly checks: ReadonlyArray<CompanyCheck>;
}): ReadonlyArray<CompanyCheck> {
  const checksByDefinitionId = new Map(checks.map((check) => [check.checkDefinitionId, check]));
  return definitions.map(
    (definition) => checksByDefinitionId.get(definition.checkDefinitionId) ?? definition,
  );
}

export function groupChecks({
  checks,
}: {
  readonly checks: ReadonlyArray<CompanyCheck>;
}): ReadonlyArray<CompanyCheckGroup> {
  const groups = new Map<string, { label: string; checks: Array<CompanyCheck> }>();
  for (const check of checks) {
    const group = groups.get(check.groupId);
    if (group) {
      group.checks.push(check);
    } else {
      groups.set(check.groupId, { label: check.groupLabel, checks: [check] });
    }
  }
  return Array.from(groups.entries()).map(([id, group]) => {
    const score = scoreChecks({ checks: group.checks });
    return {
      id,
      label: group.label,
      verdict: scoreToVerdict({ score }),
      score,
      checks: group.checks.toSorted((left, right) => left.order - right.order),
    };
  });
}

export function scoreChecks({ checks }: { readonly checks: ReadonlyArray<CompanyCheck> }) {
  const scores = checks.flatMap((check) => (check.status === "unknown" ? [] : [check.score]));
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function scoreToVerdict({
  score,
}: {
  readonly score: number | null;
}): CompanyCheckGroupVerdict {
  if (score === null) return "unknown";
  if (score >= 70) return "strong";
  if (score >= 50) return "mixed";
  return "weak";
}

export function hashCheckEngineInput({
  companyId,
  engineVersion,
  insights,
}: {
  readonly companyId: string;
  readonly engineVersion: string;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}) {
  let input = `${engineVersion}|${companyId}`;
  for (const insight of insights) {
    input = `${input}|${insight.id}|${insight.sourceId}|${insight.kind}|${insight.locator ?? ""}|${insight.text}`;
  }
  return stableHash({ input });
}

export function stableHash({ input }: { readonly input: string }) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function evaluateCheck({
  definition,
  insights,
}: {
  readonly definition: CompanyCheckDefinition;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  if (definition.groupId === tractionGroup.id)
    return evaluateTractionCheck({ definition, insights });
  return evaluateKeywordCheck({ definition, insights });
}

function evaluateKeywordCheck({
  definition,
  insights,
}: {
  readonly definition: CompanyCheckDefinition;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
}): CompanyCheckJudgement {
  const keywords = checkEvidenceKeywords[definition.id];
  if (!keywords)
    return unknownJudgement({ rationale: "No evaluator is registered for this check definition." });

  const matchingInsights = insights.filter((insight) =>
    keywords.some((keyword) => keyword.test(insight.text)),
  );
  if (matchingInsights.length === 0) {
    return unknownJudgement({
      rationale: `No ${definition.label.toLowerCase()} evidence found in source insights.`,
    });
  }

  const negativeMatches = matchingInsights.filter((insight) => negativeEvidence.test(insight.text));
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

function unknownJudgement({ rationale }: { readonly rationale: string }): CompanyCheckJudgement {
  return {
    status: "unknown",
    score: 0,
    detail: null,
    rationale,
    insightIds: [],
  };
}

const negativeEvidence =
  /\b(churn|lawsuit|litigation|down round|declin(?:e|ing)|flat|shrinking|risk|red flag|concentration|burn|runway under|less than|below|miss(?:ed|ing)|not yet|no\s+)\b/i;

const checkEvidenceKeywords: Readonly<Record<string, ReadonlyArray<RegExp>>> = {
  "team.founder_prestige": [
    /\bfounder\b/i,
    /\bco-?founder\b/i,
    /\bex[- ](?:google|meta|facebook|amazon|apple|microsoft|openai|stripe|airbnb|uber)\b/i,
    /\bYC\b|y combinator/i,
    /\bserial entrepreneur\b/i,
  ],
  "team.technical_cofounder": [
    /\btechnical co-?founder\b/i,
    /\bCTO\b/i,
    /\bengineer(?:ing)? founder\b/i,
    /\btechnical founder\b/i,
  ],
  "team.founder_market_fit": [
    /founder[- ]market fit/i,
    /\b(?:years|decade)\b.*\bexperience\b/i,
    /\bdomain expertise\b/i,
    /\bindustry experience\b/i,
  ],
  "team.completeness": [/\bteam\b/i, /\bleadership\b/i, /\bhead of\b/i, /\bVP\b/i, /\bhiring\b/i],
  "team.employee_churn": [
    /\bemployee churn\b/i,
    /\bretention\b/i,
    /\battrition\b/i,
    /\blayoffs?\b/i,
  ],
  "market.tam_credibility": [
    /\bTAM\b/i,
    /total addressable market/i,
    /\bmarket size\b/i,
    /\b\$\s*\d+(?:\.\d+)?\s*[bBmM]\b.*\bmarket\b/i,
  ],
  "market.growth_rate": [
    /\bmarket\b.*\bgrowth\b/i,
    /\bCAGR\b/i,
    /growing at/i,
    /\b\d+(?:\.\d+)?\s*%\b.*\bmarket\b/i,
  ],
  "market.competitive_landscape": [
    /\bcompet(?:itor|ition|itive)\b/i,
    /\blandscape\b/i,
    /\bdifferentiated from\b/i,
    /\bincumbents?\b/i,
  ],
  "market.timing_thesis": [
    /\btiming\b/i,
    /\bwhy now\b/i,
    /\btailwind\b/i,
    /\bregulatory shift\b/i,
    /\bplatform shift\b/i,
  ],
  "product.maturity": [
    /\bproduct\b/i,
    /\bMVP\b/i,
    /\bGA\b/i,
    /generally available/i,
    /\bdeployed\b/i,
    /\blive\b/i,
  ],
  "product.differentiation": [
    /\bdifferentiat(?:ed|ion)\b/i,
    /\bproprietary\b/i,
    /\bunique\b/i,
    /\b10x\b/i,
    /\badvantage\b/i,
  ],
  "product.user_love": [
    /\bNPS\b/i,
    /\buser love\b/i,
    /\bcustomer love\b/i,
    /\bretention\b/i,
    /\btestimonial\b/i,
    /\bexpansion\b/i,
  ],
  "product.defensibility": [
    /\bdefensib(?:le|ility)\b/i,
    /\bmoat\b/i,
    /\bpatents?\b/i,
    /\bnetwork effects?\b/i,
    /\bdata advantage\b/i,
  ],
  "deal_risk.cap_table_cleanliness": [
    /\bcap table\b/i,
    /\bSAFE\b/i,
    /\bconvertible note\b/i,
    /\bownership\b/i,
    /\bdilution\b/i,
  ],
  "deal_risk.valuation_reasonableness": [
    /\bvaluation\b/i,
    /\bprice\b/i,
    /\brevenue multiple\b/i,
    /\bARR multiple\b/i,
    /\bround size\b/i,
  ],
  "deal_risk.legal_red_flags": [
    /\blegal\b/i,
    /\blawsuit\b/i,
    /\blitigation\b/i,
    /\bIP\b/i,
    /\bcompliance\b/i,
    /\bregulatory\b/i,
  ],
  "deal_risk.source_consistency": [
    /\bconsistent\b/i,
    /\bconflict(?:ing)?\b/i,
    /\bdiscrepanc(?:y|ies)\b/i,
    /\bsource\b/i,
  ],
};

export function toEngineCheck({
  companyId,
  definition,
  engineVersion,
  judgement,
  runId,
  inputHash,
  updatedAt,
}: {
  readonly companyId: string;
  readonly definition: CompanyCheckDefinition;
  readonly engineVersion: string;
  readonly judgement: CompanyCheckJudgement;
  readonly runId: string;
  readonly inputHash: string;
  readonly updatedAt: number;
}): CompanyEngineCheck {
  return {
    id: `${companyId}:${definition.id}`,
    companyId,
    checkDefinitionId: definition.id,
    groupId: definition.groupId,
    groupLabel: definition.groupLabel,
    label: definition.label,
    status: judgement.status,
    score: judgement.score,
    detail: judgement.detail,
    rationale: judgement.rationale,
    runId,
    engineVersion,
    inputHash,
    order: definition.order,
    updatedAt,
  };
}

export function applyOverrides({
  engineChecks,
  overrides,
  links,
}: {
  readonly engineChecks: ReadonlyArray<CompanyEngineCheck>;
  readonly overrides: ReadonlyArray<CompanyCheckOverride>;
  readonly links: ReadonlyArray<CompanyCheckInsight>;
}): ReadonlyArray<CompanyCheck> {
  return engineChecks.map((engineCheck) => {
    const override = overrides.find(
      (candidate) => candidate.checkDefinitionId === engineCheck.checkDefinitionId,
    );
    const supportingInsightIds = links
      .filter((link) => link.checkDefinitionId === engineCheck.checkDefinitionId)
      .map((link) => link.insightId);
    return {
      id: engineCheck.id,
      companyId: engineCheck.companyId,
      checkDefinitionId: engineCheck.checkDefinitionId,
      groupId: engineCheck.groupId,
      groupLabel: engineCheck.groupLabel,
      label: engineCheck.label,
      status: override?.status ?? engineCheck.status,
      score: override?.score ?? engineCheck.score,
      detail: override?.detail ?? engineCheck.detail,
      rationale: override?.rationale ?? engineCheck.rationale,
      source: override ? "override" : "engine",
      overrideId: override?.id ?? null,
      supportingInsightIds,
      order: engineCheck.order,
      updatedAt: override?.updatedAt ?? engineCheck.updatedAt,
    };
  });
}

export function calculateWeightedScore({
  checks,
}: {
  readonly checks: ReadonlyArray<CompanyCheck>;
}) {
  const definitions = getCheckDefinitions({ _: undefined });
  const knownChecks = checks.filter((check) => check.status !== "unknown");
  if (knownChecks.length === 0) return null;
  const weightedTotal = knownChecks.reduce((sum, check) => {
    const definition = definitions.find((candidate) => candidate.id === check.checkDefinitionId);
    return sum + check.score * (definition?.weight ?? 1);
  }, 0);
  const totalWeight = knownChecks.reduce((sum, check) => {
    const definition = definitions.find((candidate) => candidate.id === check.checkDefinitionId);
    return sum + (definition?.weight ?? 1);
  }, 0);
  return Math.round(weightedTotal / totalWeight);
}
