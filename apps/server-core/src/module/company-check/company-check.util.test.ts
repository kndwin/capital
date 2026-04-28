import { describe, expect, it } from "vitest";
import type { CompanySourceInsight } from "../company/company.schema";
import type { CompanyCheck, CompanyEngineCheck } from "./company-check.schema";
import {
  applyOverrides,
  calculateWeightedScore,
  evaluateCheck,
  getCheckDefinitions,
  groupChecks,
  hashCheckEngineInput,
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
  it("returns traction checks", () => {
    expect(getCheckDefinitions({ _: undefined }).map((check) => check.id)).toEqual([
      "traction.arr",
      "traction.growth_rate",
    ]);
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
    const definition = getCheckDefinitions({ _: undefined })[0];
    expect(definition).toBeDefined();
    expect(evaluateCheck({ definition: definition!, insights: [insight] }).status).toBe("pass");
  });
});

describe("toEngineCheck", () => {
  it("converts a judgement to an engine check", () => {
    const definition = getCheckDefinitions({ _: undefined })[0]!;
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
