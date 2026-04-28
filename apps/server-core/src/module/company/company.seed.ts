import { Effect } from "effect";
import type { CompanyCheck, CompanyCheckOverride } from "../company-check/company-check.schema";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanyService } from "./company.service";
import type { Company, CompanySource, CompanySourceInsight } from "./company.schema";

const seedTime = 1_777_680_000_000;

const companies: ReadonlyArray<Company> = [
  {
    id: "acme-robotics",
    name: "Acme Robotics",
    description: "Warehouse autonomy for mid-market 3PLs.",
    website: "https://acme-robotics.com",
    stage: "seed",
    sector: "Robotics",
    location: "Pittsburgh, PA",
    score: 60,
    riskLevel: "medium",
    updatedAt: seedTime,
  },
  {
    id: "northstar-ai",
    name: "Northstar AI",
    description:
      "AI workflow platform for revenue teams that turns call, CRM, and support data into account-level execution plans.",
    website: "https://northstar.example",
    stage: "seed",
    sector: "Enterprise AI",
    location: "San Francisco, CA",
    score: 82,
    riskLevel: "medium",
    updatedAt: 1_777_334_400_000,
  },
  {
    id: "ledgergrid",
    name: "LedgerGrid",
    description:
      "Programmable treasury controls for multi-entity finance teams with automated cash positioning and approvals.",
    website: "https://ledgergrid.example",
    stage: "series_a",
    sector: "Fintech",
    location: "New York, NY",
    score: 76,
    riskLevel: "medium",
    updatedAt: 1_777_420_800_000,
  },
  {
    id: "voltframe",
    name: "Voltframe",
    description: "Grid analytics and battery dispatch software for distributed energy operators.",
    website: "https://voltframe.example",
    stage: "series_b",
    sector: "Climate Infrastructure",
    location: "Austin, TX",
    score: 88,
    riskLevel: "low",
    updatedAt: 1_777_507_200_000,
  },
  {
    id: "clearbrief",
    name: "ClearBrief",
    description:
      "Legal diligence workspace that maps contract clauses, obligations, and exceptions back to source documents.",
    website: "https://clearbrief.example",
    stage: "pre_seed",
    sector: "Legaltech",
    location: "Boston, MA",
    score: 64,
    riskLevel: "high",
    updatedAt: 1_777_593_600_000,
  },
  {
    id: "atlas-health",
    name: "Atlas Health",
    description:
      "Patient financial navigation platform that identifies assistance programs and automates enrollment workflows.",
    website: "https://atlas-health.example",
    stage: "growth",
    sector: "Healthcare",
    location: "Chicago, IL",
    score: 91,
    riskLevel: "low",
    updatedAt: 1_777_680_000_000,
  },
];

const acmeChecks: ReadonlyArray<CompanyCheck> = [
  check("team-founder-prestige", "team", "Team", "Founder prestige", "pass", "ex-Stripe", 10),
  check(
    "team-technical-cofounder",
    "team",
    "Team",
    "Technical co-founder",
    "pass",
    "CTO · 12y",
    20,
  ),
  check("team-completeness", "team", "Team", "Team completeness", "concern", "no GTM lead", 30),
  check("team-churn", "team", "Team", "Employee churn", "unknown", null, 40),
  check("market-tam", "market", "Market", "TAM credibility", "pass", "$8B", 50),
  check("market-growth", "market", "Market", "Growth rate", "pass", "17% CAGR", 60),
  check("market-competition", "market", "Market", "Competition", "fail", "2 incumbents", 70),
  check("traction-arr", "traction", "Traction", "ARR", "pass", "$1.2M", 80),
  check("traction-growth", "traction", "Traction", "Growth rate", "concern", "11% MoM", 90),
  check("traction-runway", "traction", "Traction", "Runway", "fail", "7 mo", 100),
];

const acmeSources: ReadonlyArray<CompanySource> = [
  source("acme-robotics", "pitch-deck-v3", "pdf", "Pitch deck v3", "14p · yest.", 92, true, 10),
  source(
    "acme-robotics",
    "q3-financials",
    "xlsx",
    "Q3 financials",
    "4 sheets · today",
    88,
    false,
    20,
  ),
  source(
    "acme-robotics",
    "crunchbase-acme",
    "url",
    "crunchbase.com/acme",
    "fetched yest.",
    76,
    false,
    30,
  ),
  source(
    "acme-robotics",
    "acme-robotics-com",
    "url",
    "acme-robotics.com",
    "homepage",
    70,
    false,
    40,
  ),
];

const northstarSources: ReadonlyArray<CompanySource> = [
  source(
    "northstar-ai",
    "northstar-seed-deck",
    "pdf",
    "Seed deck PDF",
    "12p · seeded",
    94,
    true,
    10,
  ),
];

const acmeInsights: ReadonlyArray<CompanySourceInsight> = [
  {
    id: "pitch-deck-v3-growth-excerpt",
    companyId: "acme-robotics",
    sourceId: "pitch-deck-v3",
    kind: "excerpt",
    locator: "P7",
    text: "Our last quarter we hit 22% MoM growth, with $1.2M ARR and a 71% gross margin.",
    extractorVersion: "insight-workflow-seed-v1",
    insightWorkflowRunId: "seed-acme-pitch-deck-v3",
    order: 10,
    updatedAt: seedTime,
  },
  {
    id: "q3-financials-growth-excerpt",
    companyId: "acme-robotics",
    sourceId: "q3-financials",
    kind: "excerpt",
    locator: "Sheet 1",
    text: "Q3 close shows $700k ARR and 11% MoM growth after excluding pilots.",
    extractorVersion: "insight-workflow-seed-v1",
    insightWorkflowRunId: "seed-acme-q3-financials",
    order: 20,
    updatedAt: seedTime,
  },
];

const northstarInsights: ReadonlyArray<CompanySourceInsight> = [
  {
    id: "northstar-seed-deck-traction-excerpt",
    companyId: "northstar-ai",
    sourceId: "northstar-seed-deck",
    kind: "excerpt",
    locator: "P6",
    text: "Northstar ended March with $2.4M ARR and 24% MoM growth across 38 enterprise accounts.",
    extractorVersion: "insight-workflow-seed-v1",
    insightWorkflowRunId: "seed-northstar-deck",
    order: 10,
    updatedAt: seedTime,
  },
];

const acmeOverrides: ReadonlyArray<CompanyCheckOverride> = [
  {
    id: "acme-traction-arr-kevin-override",
    companyId: "acme-robotics",
    checkDefinitionId: "traction.arr",
    status: "pass",
    score: 100,
    detail: "$1.2M",
    rationale: "Investor override: accept management ARR after reviewing pilot conversion notes.",
    createdByUserId: "kevin",
    updatedAt: seedTime,
  },
];

export const seedCompanies = Effect.fn("seedCompanies")(function* () {
  const service = yield* CompanyService;
  const checkService = yield* CompanyCheckService;
  for (const company of companies) {
    yield* service.upsert(company);
  }
  for (const check of acmeChecks) {
    yield* checkService.upsertCheck(check);
  }
  for (const source of acmeSources) {
    yield* service.upsertSource(source);
  }
  for (const source of northstarSources) {
    yield* service.upsertSource(source);
  }
  for (const insight of acmeInsights) {
    yield* service.upsertSourceInsight(insight);
  }
  for (const insight of northstarInsights) {
    yield* service.upsertSourceInsight(insight);
  }
  for (const override of acmeOverrides) {
    yield* checkService.upsertCheckOverride(override);
  }
  yield* checkService.runCheckEngine("acme-robotics", "seed_source_insights_changed");
  yield* checkService.runCheckEngine("northstar-ai", "seed_pdf_uploaded");
  yield* Effect.logInfo(`Seeded ${companies.length} companies`);
});

function check(
  id: string,
  groupId: string,
  groupLabel: string,
  label: string,
  status: CompanyCheck["status"],
  detail: string | null,
  order: number,
): CompanyCheck {
  return {
    id,
    companyId: "acme-robotics",
    checkDefinitionId: `seed.${groupId}.${id}`,
    groupId,
    groupLabel,
    label,
    status,
    score: status === "pass" ? 100 : status === "concern" ? 60 : status === "fail" ? 20 : 0,
    detail,
    rationale: detail ?? "Seeded check.",
    source: "seed",
    overrideId: null,
    supportingInsightIds: [],
    order,
    updatedAt: seedTime,
  };
}

function source(
  companyId: string,
  id: string,
  kind: CompanySource["kind"],
  title: string,
  subtitle: string,
  confidence: number,
  selected: boolean,
  order: number,
): CompanySource {
  return {
    id,
    companyId,
    kind,
    title,
    subtitle,
    confidence,
    selected,
    order,
    updatedAt: seedTime,
  };
}
