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
import { evaluateTractionCheck, tractionGroup } from "./group/traction/traction.group";

export function getCheckDefinitions({
  _,
}: {
  readonly _: undefined;
}): ReadonlyArray<CompanyCheckDefinition> {
  return _ === undefined ? tractionGroup.checks : tractionGroup.checks;
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
      checks: group.checks,
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
  return {
    status: "unknown",
    score: 0,
    detail: null,
    rationale: "No evaluator is registered for this check group.",
    insightIds: [],
  };
}

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
