import { describe, expect, it } from "vitest";
import type { CompanySourceInsight } from "../company/company.schema";
import type { CompanyCheck, CompanyEngineCheck } from "./company-check.schema";
import {
  applyOverrides,
  calculateWeightedScore,
  evaluateCheck,
  getDefinitionChecks,
  getCheckDefinitions,
  groupChecks,
  hashCheckEngineInput,
  mergeDefinitionChecks,
  scoreChecks,
  scoreToVerdict,
  stableHash,
  toEngineCheck,
} from "./company-check.util";

const baseCheck: CompanyCheck = {
  id: "company:traction.arr",
  companyId: "company",
  checkDefinitionId: "traction.arr",
  groupId: "traction",
  groupLabel: "Traction",
  label: "ARR",
  status: "pass",
  score: 100,
  detail: "$1.2M",
  rationale: "ARR evidence indicates at least $1M ARR.",
  source: "engine",
  overrideId: null,
  supportingInsightIds: [],
  order: 10,
  updatedAt: 1,
};

const insight: CompanySourceInsight = {
  id: "deck-arr",
  companyId: "company",
  sourceId: "deck",
  kind: "excerpt",
  locator: "P7",
  text: "We reached $1.2M ARR with 22% MoM growth.",
  extractorVersion: "test-v1",
  insightWorkflowRunId: "test-run",
  order: 10,
  updatedAt: 1,
};

describe("getCheckDefinitions", () => {
  it("returns the full diligence check list", () => {
    const definitions = getCheckDefinitions({ _: undefined });

    expect(definitions).toHaveLength(23);
    expect(definitions.map((check) => check.id)).toContain("traction.arr");
    expect(definitions.map((check) => check.id)).toContain("deal_risk.source_consistency");
  });
});

describe("getDefinitionChecks", () => {
  it("returns unknown checks for every definition", () => {
    const checks = getDefinitionChecks({ companyId: "company", updatedAt: 1 });

    expect(checks).toHaveLength(23);
    expect(checks.every((check) => check.status === "unknown")).toBe(true);
    expect(checks.every((check) => check.source === "definition")).toBe(true);
  });
});

describe("mergeDefinitionChecks", () => {
  it("overlays evaluated checks onto the full definition list", () => {
    const definitions = getDefinitionChecks({ companyId: "company", updatedAt: 1 });
    const checks = mergeDefinitionChecks({ definitions, checks: [baseCheck] });

    expect(checks).toHaveLength(23);
    expect(checks.find((check) => check.checkDefinitionId === "traction.arr")?.status).toBe("pass");
    expect(
      checks.find((check) => check.checkDefinitionId === "team.founder_prestige")?.status,
    ).toBe("unknown");
  });
});

describe("groupChecks", () => {
  it("groups checks and scores each group", () => {
    expect(groupChecks({ checks: [baseCheck] })).toEqual([
      { id: "traction", label: "Traction", verdict: "strong", score: 100, checks: [baseCheck] },
    ]);
  });
});

describe("scoreChecks", () => {
  it("ignores unknown checks", () => {
    expect(
      scoreChecks({ checks: [baseCheck, { ...baseCheck, id: "unknown", status: "unknown" }] }),
    ).toBe(100);
  });
});

describe("scoreToVerdict", () => {
  it("maps scores to verdicts", () => {
    expect(scoreToVerdict({ score: null })).toBe("unknown");
    expect(scoreToVerdict({ score: 80 })).toBe("strong");
    expect(scoreToVerdict({ score: 60 })).toBe("mixed");
    expect(scoreToVerdict({ score: 20 })).toBe("weak");
  });
});

describe("hashCheckEngineInput", () => {
  it("hashes company insight input", () => {
    expect(
      hashCheckEngineInput({ companyId: "company", engineVersion: "v1", insights: [insight] }),
    ).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("stableHash", () => {
  it("returns stable hex hashes", () => {
    expect(stableHash({ input: "abc" })).toBe(stableHash({ input: "abc" }));
  });
});

describe("evaluateCheck", () => {
  it("evaluates registered traction checks", () => {
    const definition = getCheckDefinitions({ _: undefined }).find(
      (check) => check.id === "traction.arr",
    );
    expect(definition).toBeDefined();
    expect(evaluateCheck({ definition: definition!, insights: [insight] }).status).toBe("pass");
  });

  it("evaluates non-traction checks from source insight evidence", () => {
    const definition = getCheckDefinitions({ _: undefined }).find(
      (check) => check.id === "market.tam_credibility",
    );
    expect(definition).toBeDefined();

    const judgement = evaluateCheck({
      definition: definition!,
      insights: [
        {
          ...insight,
          id: "deck-tam",
          text: "The company targets a $12B TAM in financial operations software.",
        },
      ],
    });

    expect(judgement.status).toBe("concern");
    expect(judgement.score).toBe(60);
    expect(judgement.insightIds).toEqual(["deck-tam"]);
  });
});

describe("toEngineCheck", () => {
  it("converts a judgement to an engine check", () => {
    const definition = getCheckDefinitions({ _: undefined }).find(
      (check) => check.id === "traction.arr",
    )!;
    const check = toEngineCheck({
      companyId: "company",
      definition,
      engineVersion: "v1",
      judgement: evaluateCheck({ definition, insights: [insight] }),
      runId: "run",
      inputHash: "hash",
      updatedAt: 1,
    });
    expect(check.id).toBe("company:traction.arr");
  });
});

describe("applyOverrides", () => {
  it("applies overrides to engine checks", () => {
    const engineCheck: CompanyEngineCheck = {
      ...baseCheck,
      runId: "run",
      engineVersion: "v1",
      inputHash: "hash",
    };
    expect(
      applyOverrides({
        engineChecks: [engineCheck],
        overrides: [{ ...baseCheck, id: "override", createdByUserId: "user" }],
        links: [],
      })[0]?.source,
    ).toBe("override");
  });
});

describe("calculateWeightedScore", () => {
  it("calculates weighted score for known checks", () => {
    expect(calculateWeightedScore({ checks: [baseCheck] })).toBe(100);
  });
});
