import { Effect } from "effect";
import type { CompanyCheck, CompanyCheckOverride } from "../company-check/company-check.schema";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanyService } from "./company.service";
import type { Company, CompanySource, CompanySourceInsight } from "./company.schema";

const seedTime = 1_777_680_000_000;
const extractorVersion = "insight-workflow-seed-v2";

const companies: ReadonlyArray<Company> = [
  company({
    id: "northstar-ai",
    name: "Northstar AI",
    description:
      "Account execution platform that turns CRM, call, and support data into weekly revenue plans for enterprise teams.",
    website: "https://northstar.ai",
    stage: "seed",
    sector: "Enterprise AI",
    location: "San Francisco, CA",
    score: 83,
    riskLevel: "low",
    updatedAt: 1_777_334_400_000,
  }),
  company({
    id: "voltframe",
    name: "Voltframe",
    description:
      "Grid analytics and battery dispatch software that helps distributed energy operators monetize flexible load.",
    website: "https://voltframe.energy",
    stage: "series_a",
    sector: "Climate Infrastructure",
    location: "Austin, TX",
    score: 72,
    riskLevel: "medium",
    updatedAt: 1_777_507_200_000,
  }),
  company({
    id: "clearbrief",
    name: "ClearBrief",
    description:
      "Legal diligence workspace that maps contract clauses, obligations, and exceptions back to source documents.",
    website: "https://clearbrief.legal",
    stage: "pre_seed",
    sector: "Legaltech",
    location: "Boston, MA",
    score: 59,
    riskLevel: "medium",
    updatedAt: 1_777_593_600_000,
  }),
];

const sources: ReadonlyArray<CompanySource> = [
  source({
    companyId: "northstar-ai",
    id: "northstar-seed-deck",
    kind: "pdf",
    title: "Northstar AI Seed Deck",
    subtitle: "14 slides · founder supplied",
    confidence: 96,
    selected: true,
    order: 10,
    acquiredProvider: "pdf_parser",
    acquiredText: `Slide 3: Northstar converts call transcripts, CRM fields, and support escalations into account execution plans that frontline managers use every Monday.
Slide 6: Northstar ended March at $2.4M ARR across 38 enterprise accounts, up from $1.1M ARR in December. Management reports 24% month-over-month growth and 78% gross margin.
Slide 8: The founding team previously built revenue intelligence systems at Stripe and Gong. The CTO led a 22-person applied AI group and owns the core data graph.
Slide 11: Risks called out by management include 3-4 week CRM mapping during onboarding and concentration in the first cohort of expansion customers.`,
  }),
  source({
    companyId: "northstar-ai",
    id: "northstar-customer-call-notes",
    kind: "note",
    title: "Customer Call Notes",
    subtitle: "3 calls · VP RevOps / CRO users",
    confidence: 90,
    selected: false,
    order: 20,
    acquiredProvider: "user_note",
    acquiredText: `VP RevOps at a 900-seat SaaS company said, "Northstar is the first tool my frontline managers open on Monday." The team previously ran account reviews from spreadsheets and Gong snippets.
CRO at a cybersecurity customer said Northstar replaced a weekly revenue war room and shortened manager prep time from six hours to under one hour.
Two customers flagged brittle Salesforce permissions during onboarding. Both still renewed because account plans were adopted by sales managers without executive pressure.`,
  }),
  source({
    companyId: "northstar-ai",
    id: "northstar-arr-export",
    kind: "xlsx",
    title: "March ARR Export",
    subtitle: "ARR, cohort, burn tabs",
    confidence: 88,
    selected: false,
    order: 30,
    acquiredProvider: "xlsx_parser",
    acquiredText: `ARR tab: March committed ARR is $2.4M. Finance-adjusted ARR is $2.1M after excluding two paid pilots that have not converted to annual contracts.
Cohort tab: Top five accounts represent 41% of ARR. Last two signed cohorts show 132% net revenue retention after seat expansion.
Burn tab: Net burn is $420k per month with $5.1M cash on hand, implying 12 months runway before the proposed seed extension.`,
  }),
  source({
    companyId: "northstar-ai",
    id: "northstar-market-research",
    kind: "chat",
    title: "Market Landscape Research",
    subtitle: "AI web research · RevOps automation",
    confidence: 82,
    selected: false,
    order: 40,
    acquiredProvider: "user_note",
    acquiredText: `Revenue teams are consolidating point tools as CRM data quality, conversation intelligence, and support escalation data converge. Northstar's wedge is account-level execution rather than call coaching.
Competitive risk is moderate: incumbents own conversation data, but customers described Northstar as the workflow layer after analysis rather than another recording tool.
Market timing is favorable because AI budget has moved from experimentation into manager productivity and forecast accuracy.`,
  }),
  source({
    companyId: "voltframe",
    id: "voltframe-technical-memo",
    kind: "pdf",
    title: "Voltframe Technical Memo",
    subtitle: "Architecture review · partner supplied",
    confidence: 92,
    selected: true,
    order: 10,
    acquiredProvider: "pdf_parser",
    acquiredText: `Voltframe forecasts feeder congestion and dispatches batteries, thermostats, and EV chargers against day-ahead price and grid constraint signals.
The platform processed 1.8B telemetry points in Q1 with 99.92% ingest uptime. The core risk is data coverage: two utility integrations still require manual validation before automated dispatch.
The founding team includes a former ERCOT grid operations lead and a distributed systems engineer from Tesla Energy.`,
  }),
  source({
    companyId: "voltframe",
    id: "voltframe-pilot-results",
    kind: "xlsx",
    title: "Utility Pilot Results",
    subtitle: "5 pilots · dispatch performance",
    confidence: 89,
    selected: false,
    order: 20,
    acquiredProvider: "xlsx_parser",
    acquiredText: `Pilot summary: Five pilots completed across Texas and California. Three moved to paid annual contracts and two remain in procurement.
Financial tab: Current ARR is $1.6M, up 14% month-over-month. Gross margin is 64% after cloud telemetry costs and integration support.
Operations tab: Average deployment takes 74 days because utility data schemas vary materially by service territory.`,
  }),
  source({
    companyId: "voltframe",
    id: "voltframe-utility-lois",
    kind: "note",
    title: "Utility LOI Review",
    subtitle: "Counsel notes · commercial diligence",
    confidence: 84,
    selected: false,
    order: 30,
    acquiredProvider: "user_note",
    acquiredText: `Three signed LOIs reference paid deployments if Voltframe passes cybersecurity review and demonstrates dispatch accuracy above 95% during summer peaks.
LOIs are non-binding and procurement cycles are expected to run 6-9 months. One counterparty requested broad indemnity for dispatch errors.
No obvious IP assignment issue was found, but counsel wants final review of the university-sponsored forecasting model before close.`,
  }),
  source({
    companyId: "voltframe",
    id: "voltframe-market-map",
    kind: "chat",
    title: "Grid Flexibility Market Map",
    subtitle: "AI web research · DERMS / VPP",
    confidence: 80,
    selected: false,
    order: 40,
    acquiredProvider: "user_note",
    acquiredText: `Demand for virtual power plant and distributed energy orchestration is rising as interconnection queues stretch and grid operators seek non-wires alternatives.
Voltframe competes with DERMS vendors and in-house utility analytics teams. Its differentiation is faster deployment for independent power producers that operate across utility territories.
Market timing is strong, but sales cycles and regulatory approvals create slower conversion than typical SaaS.`,
  }),
  source({
    companyId: "clearbrief",
    id: "clearbrief-founder-memo",
    kind: "pdf",
    title: "Founder Memo",
    subtitle: "Pre-seed fundraise narrative",
    confidence: 88,
    selected: true,
    order: 10,
    acquiredProvider: "pdf_parser",
    acquiredText: `ClearBrief helps investors and law firms trace diligence questions back to contract clauses, side letters, and exception schedules.
The founding CEO was a private equity associate who managed legal diligence on 20 platform acquisitions. The technical founder previously built document classification systems for a public e-discovery company.
The company is at $420k ARR from 11 customers, with 19% month-over-month growth over the last quarter. Management is still founder-led on sales.`,
  }),
  source({
    companyId: "clearbrief",
    id: "clearbrief-demo-transcript",
    kind: "note",
    title: "Product Demo Transcript",
    subtitle: "Partner demo · clause traceability",
    confidence: 86,
    selected: false,
    order: 20,
    acquiredProvider: "user_note",
    acquiredText: `The demo mapped a change-of-control clause to the exact source page, showed the extracted obligation, and produced a redline-ready diligence question in under two minutes.
Users liked that every generated answer included a citation and confidence note. The weakest moment was bulk upload: the system stalled on a 600-page purchase agreement until the founder retried parsing.
Product feels useful for boutique funds and outside counsel, but admin workflows and permissioning are not mature enough for large enterprise legal teams.`,
  }),
  source({
    companyId: "clearbrief",
    id: "clearbrief-usage-export",
    kind: "xlsx",
    title: "Usage Analytics Export",
    subtitle: "Weekly active users / cohorts",
    confidence: 81,
    selected: false,
    order: 30,
    acquiredProvider: "xlsx_parser",
    acquiredText: `Usage tab: 11 paying customers and 84 weekly active users. Median weekly active seat usage is 61%, but two customers have no active use in the last 21 days.
Revenue tab: ARR is $420k. Gross margin is 71% after document processing cost. Net burn is $180k per month with 9 months runway.
Cohort tab: Expansion revenue is early; only three customers have upgraded beyond the initial diligence workspace package.`,
  }),
  source({
    companyId: "clearbrief",
    id: "clearbrief-competitive-scan",
    kind: "chat",
    title: "Legal AI Competitive Scan",
    subtitle: "AI web research · contract diligence",
    confidence: 78,
    selected: false,
    order: 40,
    acquiredProvider: "user_note",
    acquiredText: `Legal AI is crowded with horizontal contract review tools, e-discovery incumbents, and new generative search products. ClearBrief's narrow diligence workflow is sharper than broad legal chat, but defensibility is not yet obvious.
The strongest wedge is evidence quality: every answer must map to source text, which matters in investment committee and counsel workflows.
Competitive risk remains high because larger platforms can bundle similar clause extraction into existing document repositories.`,
  }),
];

const insights: ReadonlyArray<CompanySourceInsight> = [
  insight(
    "northstar-ai",
    "northstar-seed-deck",
    "P6",
    "Northstar ended March at $2.4M ARR across 38 enterprise accounts, up from $1.1M ARR in December.",
    10,
  ),
  insight(
    "northstar-ai",
    "northstar-seed-deck",
    "P6",
    "Management reports 24% month-over-month growth and 78% gross margin.",
    20,
  ),
  insight(
    "northstar-ai",
    "northstar-seed-deck",
    "P8",
    "The founding team previously built revenue intelligence systems at Stripe and Gong.",
    30,
  ),
  insight(
    "northstar-ai",
    "northstar-customer-call-notes",
    "Call 1",
    "VP RevOps said Northstar is the first tool frontline managers open on Monday.",
    40,
  ),
  insight(
    "northstar-ai",
    "northstar-arr-export",
    "Cohort tab",
    "Top five accounts represent 41% of ARR, while the last two cohorts show 132% net revenue retention.",
    50,
  ),
  insight(
    "northstar-ai",
    "northstar-arr-export",
    "Burn tab",
    "Net burn is $420k per month with $5.1M cash on hand, implying 12 months runway.",
    60,
  ),
  insight(
    "northstar-ai",
    "northstar-market-research",
    "Research summary",
    "Competitive risk is moderate because incumbents own conversation data, but Northstar is positioned as the workflow layer after analysis.",
    70,
  ),
  insight(
    "voltframe",
    "voltframe-technical-memo",
    "Architecture",
    "Voltframe processed 1.8B telemetry points in Q1 with 99.92% ingest uptime.",
    10,
  ),
  insight(
    "voltframe",
    "voltframe-technical-memo",
    "Team",
    "The founding team includes a former ERCOT grid operations lead and a distributed systems engineer from Tesla Energy.",
    20,
  ),
  insight(
    "voltframe",
    "voltframe-pilot-results",
    "Pilot summary",
    "Five pilots completed; three moved to paid annual contracts and two remain in procurement.",
    30,
  ),
  insight(
    "voltframe",
    "voltframe-pilot-results",
    "Financial tab",
    "Current ARR is $1.6M, up 14% month-over-month, with 64% gross margin after telemetry and support costs.",
    40,
  ),
  insight(
    "voltframe",
    "voltframe-pilot-results",
    "Operations tab",
    "Average deployment takes 74 days because utility data schemas vary by service territory.",
    50,
  ),
  insight(
    "voltframe",
    "voltframe-utility-lois",
    "Counsel notes",
    "Three signed LOIs are non-binding and require cybersecurity review plus dispatch accuracy above 95%.",
    60,
  ),
  insight(
    "voltframe",
    "voltframe-market-map",
    "Market summary",
    "Market timing is strong, but sales cycles and regulatory approvals create slower conversion than typical SaaS.",
    70,
  ),
  insight(
    "clearbrief",
    "clearbrief-founder-memo",
    "Traction",
    "ClearBrief is at $420k ARR from 11 customers with 19% month-over-month growth over the last quarter.",
    10,
  ),
  insight(
    "clearbrief",
    "clearbrief-founder-memo",
    "Team",
    "The CEO managed legal diligence on 20 platform acquisitions and the technical founder built e-discovery classification systems.",
    20,
  ),
  insight(
    "clearbrief",
    "clearbrief-demo-transcript",
    "Demo",
    "Every generated answer included a citation and confidence note, which users highlighted as the key trust feature.",
    30,
  ),
  insight(
    "clearbrief",
    "clearbrief-demo-transcript",
    "Demo issue",
    "The system stalled on a 600-page purchase agreement until the founder retried parsing.",
    40,
  ),
  insight(
    "clearbrief",
    "clearbrief-usage-export",
    "Usage tab",
    "There are 11 paying customers and 84 weekly active users, but two customers have no active use in the last 21 days.",
    50,
  ),
  insight(
    "clearbrief",
    "clearbrief-usage-export",
    "Revenue tab",
    "ARR is $420k, gross margin is 71%, and net burn is $180k per month with 9 months runway.",
    60,
  ),
  insight(
    "clearbrief",
    "clearbrief-competitive-scan",
    "Market summary",
    "Legal AI is crowded, and larger platforms can bundle similar clause extraction into existing repositories.",
    70,
  ),
];

const checks: ReadonlyArray<CompanyCheck> = [
  check(
    "northstar-ai",
    "team.founder_prestige",
    "team",
    "Team",
    "Founder prestige",
    "pass",
    "Stripe/Gong",
    "Founders have directly relevant revenue intelligence experience at category-defining companies.",
    10,
  ),
  check(
    "northstar-ai",
    "team.technical_cofounder",
    "team",
    "Team",
    "Technical co-founder",
    "pass",
    "AI graph lead",
    "CTO previously led a 22-person applied AI group and owns the core data graph.",
    20,
  ),
  check(
    "northstar-ai",
    "team.founder_market_fit",
    "team",
    "Team",
    "Founder-market fit",
    "pass",
    "RevOps native",
    "Team has lived the revenue workflow problem and sells into known buyer personas.",
    30,
  ),
  check(
    "northstar-ai",
    "market.tam_credibility",
    "market",
    "Market",
    "TAM credibility",
    "pass",
    "Large RevOps budget",
    "Revenue productivity and forecast accuracy are durable enterprise budget lines.",
    110,
  ),
  check(
    "northstar-ai",
    "market.competitive_landscape",
    "market",
    "Market",
    "Competitive landscape",
    "concern",
    "Incumbents nearby",
    "Conversation intelligence vendors could move downstream into execution workflows.",
    130,
  ),
  check(
    "northstar-ai",
    "product.differentiation",
    "product",
    "Product",
    "Differentiation",
    "pass",
    "Workflow layer",
    "Customers describe Northstar as the post-analysis execution layer, not another recording product.",
    220,
  ),
  check(
    "northstar-ai",
    "product.user_love",
    "product",
    "Product",
    "User love",
    "pass",
    "Opened weekly",
    "Manager adoption appears organic and recurring in customer calls.",
    230,
  ),
  check(
    "northstar-ai",
    "traction.arr",
    "traction",
    "Traction & Financials",
    "Revenue scale",
    "pass",
    "$2.4M ARR",
    "Reported ARR is strong for seed, even after finance-adjusting pilots out of committed ARR.",
    310,
  ),
  check(
    "northstar-ai",
    "traction.growth_rate",
    "traction",
    "Traction & Financials",
    "Growth rate",
    "pass",
    "24% MoM",
    "Growth is above seed benchmark and supported by recent cohort expansion.",
    320,
  ),
  check(
    "northstar-ai",
    "traction.customer_concentration",
    "traction",
    "Traction & Financials",
    "Customer concentration",
    "concern",
    "Top 5 = 41% ARR",
    "Concentration is notable but not disqualifying at this stage.",
    350,
  ),
  check(
    "northstar-ai",
    "deal_risk.valuation_reasonableness",
    "deal_risk",
    "Deal & Risk",
    "Valuation reasonableness",
    "concern",
    "Extension pricing",
    "Round terms need discipline because AI revenue multiples are volatile.",
    420,
  ),
  check(
    "northstar-ai",
    "deal_risk.source_consistency",
    "deal_risk",
    "Deal & Risk",
    "Source consistency",
    "pass",
    "Deck vs finance reconciled",
    "Deck ARR and finance export reconcile once paid pilots are excluded.",
    440,
  ),
  check(
    "voltframe",
    "team.founder_market_fit",
    "team",
    "Team",
    "Founder-market fit",
    "pass",
    "ERCOT + Tesla",
    "Founders combine grid operations and distributed systems expertise.",
    30,
  ),
  check(
    "voltframe",
    "team.completeness",
    "team",
    "Team",
    "Team completeness",
    "concern",
    "Enterprise sales gap",
    "Team is technical and domain-heavy but still light on utility enterprise sales leadership.",
    40,
  ),
  check(
    "voltframe",
    "market.growth_rate",
    "market",
    "Market",
    "Market growth rate",
    "pass",
    "Grid flexibility",
    "VPP and non-wires alternatives are pulled by interconnection delays and load growth.",
    120,
  ),
  check(
    "voltframe",
    "market.timing_thesis",
    "market",
    "Market",
    "Timing thesis",
    "pass",
    "Peak constraint pressure",
    "Utility demand for flexible load orchestration is increasing this cycle.",
    140,
  ),
  check(
    "voltframe",
    "product.maturity",
    "product",
    "Product",
    "Product maturity",
    "concern",
    "74-day deployments",
    "The platform works, but deployment remains services-heavy because utility schemas vary.",
    210,
  ),
  check(
    "voltframe",
    "product.defensibility",
    "product",
    "Product",
    "Defensibility",
    "pass",
    "Telemetry graph",
    "Operational telemetry and dispatch history should compound as more assets connect.",
    240,
  ),
  check(
    "voltframe",
    "traction.arr",
    "traction",
    "Traction & Financials",
    "Revenue scale",
    "pass",
    "$1.6M ARR",
    "Revenue scale is solid for a climate infrastructure Series A candidate.",
    310,
  ),
  check(
    "voltframe",
    "traction.growth_rate",
    "traction",
    "Traction & Financials",
    "Growth rate",
    "concern",
    "14% MoM",
    "Growth is healthy but gated by long procurement cycles.",
    320,
  ),
  check(
    "voltframe",
    "traction.gross_margin",
    "traction",
    "Traction & Financials",
    "Gross margin",
    "concern",
    "64%",
    "Cloud telemetry and integration support weigh on software margins.",
    330,
  ),
  check(
    "voltframe",
    "deal_risk.legal_red_flags",
    "deal_risk",
    "Deal & Risk",
    "Legal red flags",
    "concern",
    "Indemnity request",
    "One LOI asks for broad indemnity around dispatch errors and needs counsel review.",
    430,
  ),
  check(
    "voltframe",
    "deal_risk.source_consistency",
    "deal_risk",
    "Deal & Risk",
    "Source consistency",
    "pass",
    "Pilots match LOIs",
    "Pilot outcomes, LOIs, and technical memo tell a consistent story.",
    440,
  ),
  check(
    "clearbrief",
    "team.founder_market_fit",
    "team",
    "Team",
    "Founder-market fit",
    "pass",
    "PE diligence",
    "CEO has first-hand diligence workflow experience across 20 platform acquisitions.",
    30,
  ),
  check(
    "clearbrief",
    "team.completeness",
    "team",
    "Team",
    "Team completeness",
    "concern",
    "Founder-led sales",
    "Sales is still founder-led and there is no dedicated legal enterprise GTM leader.",
    40,
  ),
  check(
    "clearbrief",
    "market.competitive_landscape",
    "market",
    "Market",
    "Competitive landscape",
    "fail",
    "Crowded legal AI",
    "Horizontal legal AI platforms and e-discovery incumbents can bundle similar extraction.",
    130,
  ),
  check(
    "clearbrief",
    "market.timing_thesis",
    "market",
    "Market",
    "Timing thesis",
    "pass",
    "AI diligence pull",
    "Buyers are actively testing AI in diligence workflows where citation quality matters.",
    140,
  ),
  check(
    "clearbrief",
    "product.user_love",
    "product",
    "Product",
    "User love",
    "pass",
    "Citation trust",
    "Users reacted strongly to source-linked answers and confidence notes.",
    230,
  ),
  check(
    "clearbrief",
    "product.maturity",
    "product",
    "Product",
    "Product maturity",
    "concern",
    "Bulk upload stalls",
    "The demo exposed reliability limits on long transaction documents.",
    210,
  ),
  check(
    "clearbrief",
    "traction.arr",
    "traction",
    "Traction & Financials",
    "Revenue scale",
    "concern",
    "$420k ARR",
    "ARR is credible for pre-seed but still early.",
    310,
  ),
  check(
    "clearbrief",
    "traction.growth_rate",
    "traction",
    "Traction & Financials",
    "Growth rate",
    "pass",
    "19% MoM",
    "Quarterly growth is promising from a small base.",
    320,
  ),
  check(
    "clearbrief",
    "traction.burn_runway",
    "traction",
    "Traction & Financials",
    "Burn rate & runway",
    "concern",
    "9 months",
    "Runway is manageable but requires financing progress this year.",
    340,
  ),
  check(
    "clearbrief",
    "traction.net_retention",
    "traction",
    "Traction & Financials",
    "Net retention",
    "unknown",
    null,
    "Expansion data is too early to underwrite net retention.",
    360,
  ),
  check(
    "clearbrief",
    "deal_risk.valuation_reasonableness",
    "deal_risk",
    "Deal & Risk",
    "Valuation reasonableness",
    "concern",
    "Pre-seed pricing",
    "Pricing should reflect competitive risk and early enterprise readiness.",
    420,
  ),
  check(
    "clearbrief",
    "deal_risk.source_consistency",
    "deal_risk",
    "Deal & Risk",
    "Source consistency",
    "pass",
    "Sources align",
    "Memo, demo, usage export, and market scan are directionally consistent.",
    440,
  ),
];

const overrides: ReadonlyArray<CompanyCheckOverride> = [
  {
    id: "clearbrief-competitive-landscape-kevin-override",
    companyId: "clearbrief",
    checkDefinitionId: "market.competitive_landscape",
    status: "concern",
    score: 55,
    detail: "Crowded but focused wedge",
    rationale:
      "Investor override: downgrade from fail because citation-backed diligence is a narrower and more urgent wedge than generic legal AI chat.",
    createdByUserId: "kevin",
    updatedAt: seedTime,
  },
];

export const seedCompanies = Effect.fn("seedCompanies")(function* () {
  const service = yield* CompanyService;
  const checkService = yield* CompanyCheckService;
  for (const input of companies) {
    yield* service.upsert(input);
  }
  for (const input of checks) {
    yield* checkService.upsertCheck(input);
  }
  for (const input of sources) {
    yield* service.upsertSource(input);
  }
  for (const input of insights) {
    yield* service.upsertSourceInsight(input);
  }
  for (const input of overrides) {
    yield* checkService.upsertCheckOverride(input);
  }
  for (const input of companies) {
    yield* checkService.runCheckEngine(input.id, "seed_source_insights_changed");
  }
  yield* Effect.logInfo(`Seeded ${companies.length} high-quality companies`);
});

function company(input: Company): Company {
  return input;
}

function source(input: {
  readonly companyId: string;
  readonly id: string;
  readonly kind: CompanySource["kind"];
  readonly title: string;
  readonly subtitle: string;
  readonly confidence: number;
  readonly selected: boolean;
  readonly order: number;
  readonly acquiredProvider: NonNullable<CompanySource["acquiredProvider"]>;
  readonly acquiredText: string;
}): CompanySource {
  return {
    id: input.id,
    companyId: input.companyId,
    kind: input.kind,
    status: "ready",
    title: input.title,
    subtitle: input.subtitle,
    confidence: input.confidence,
    selected: input.selected,
    order: input.order,
    url: input.kind === "url" ? input.title : null,
    fileName: input.kind === "pdf" || input.kind === "xlsx" ? input.title : null,
    fileUrl: null,
    acquiredProvider: input.acquiredProvider,
    acquiredText: input.acquiredText,
    acquiredTextTruncated: false,
    acquiredTextCharCount: input.acquiredText.length,
    acquiredTextHash: null,
    error: null,
    updatedAt: seedTime,
  };
}

function insight(
  companyId: string,
  sourceId: string,
  locator: string,
  text: string,
  order: number,
): CompanySourceInsight {
  const id = `${sourceId}-${order}`;
  return {
    id,
    companyId,
    sourceId,
    kind: "excerpt",
    locator,
    text,
    extractorVersion,
    insightWorkflowRunId: `seed-${sourceId}`,
    order,
    updatedAt: seedTime,
  };
}

function check(
  companyId: string,
  checkDefinitionId: string,
  groupId: string,
  groupLabel: string,
  label: string,
  status: CompanyCheck["status"],
  detail: string | null,
  rationale: string,
  order: number,
): CompanyCheck {
  return {
    id: `${companyId}:${checkDefinitionId}:seed`,
    companyId,
    checkDefinitionId,
    groupId,
    groupLabel,
    label,
    status,
    score: status === "pass" ? 100 : status === "concern" ? 60 : status === "fail" ? 20 : 0,
    detail,
    rationale,
    source: "seed",
    overrideId: null,
    supportingInsightIds: [],
    order,
    updatedAt: seedTime,
  };
}
