import { Effect } from "effect";
import { CompanyService } from "./company.service";
import type { Company } from "./company.schema";

const companies: ReadonlyArray<Company> = [
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

export const seedCompanies = Effect.fn("seedCompanies")(function* () {
  const service = yield* CompanyService;
  for (const company of companies) {
    yield* service.upsert(company);
  }
  yield* Effect.logInfo(`Seeded ${companies.length} companies`);
});
