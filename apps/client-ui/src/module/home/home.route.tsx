import { createFileRoute, Link } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Company } from "@capital/server-core/rpc";
import { companiesAtom } from "../company/company.atom";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";

type Tone = "mixed" | "strong" | "weak";

type DashboardCompany = {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly x: number;
  readonly y: number;
  readonly tone: Tone;
};

const toneClassName = {
  mixed: "bg-amber-500/80",
  strong: "bg-emerald-500/70",
  weak: "bg-destructive/70",
} as const;

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const companies = useAtomValue(companiesAtom);

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Capital</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(companies, {
          onInitial: () => <DashboardLoading />,
          onFailure: () => <DashboardError />,
          onSuccess: (result) => <PortfolioDashboard companies={result.value} />,
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}

function PortfolioDashboard({ companies }: { readonly companies: ReadonlyArray<Company> }) {
  const dashboardCompanies = toDashboardCompanies(companies);
  const counts = getToneCounts(dashboardCompanies);
  const strongest = getStrongest(dashboardCompanies);

  if (dashboardCompanies.length === 0) {
    return <DashboardEmpty companyCount={companies.length} />;
  }

  return (
    <div
      data-slot="portfolio-dashboard"
      className="max-w-6xl overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <header data-slot="portfolio-dashboard-header" className="border-b p-5 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Score x freshness
            </p>
            <h2 id="portfolio-map-title" className="text-3xl font-semibold tracking-tight">
              Portfolio map
            </h2>
            <p className="max-w-3xl text-base font-medium text-muted-foreground">
              Each company is placed by its current score and how recently it changed.
            </p>
            <p className="text-sm text-muted-foreground">
              {dashboardCompanies.length} of {companies.length} companies scored
            </p>
          </div>
          <div data-slot="portfolio-dashboard-composite" className="text-left lg:text-right">
            <div className="text-6xl font-light tabular-nums tracking-tight">
              {strongest?.score ?? "--"}
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Top score
            </div>
            <Link to="/company" className="mt-2 block text-sm font-medium text-primary">
              View companies -&gt;
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="portfolio-map-title">
        <TabHeader active="Map" inactive="List" />
        <div className="p-5 lg:p-8">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-5">
            <div className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Score
            </div>
            <div className="relative aspect-[16/9] min-h-80 overflow-visible rounded-lg bg-muted/20">
              <div className="absolute inset-x-0 top-1/2 border-t border-border/60" />
              <div className="absolute inset-y-0 left-1/2 border-l border-border/60" />
              {dashboardCompanies.map((company) => (
                <Link
                  key={company.id}
                  to="/company/$companyId"
                  params={{ companyId: company.id }}
                  className="group absolute flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  style={{ left: `${company.x}%`, top: `${100 - company.y}%` }}
                  title={`${company.name} ${company.score}`}
                >
                  <span
                    className={`size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition group-hover:scale-150 ${toneClassName[company.tone]}`}
                  />
                  <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md border bg-background/95 px-2 py-1 text-xs font-medium text-foreground opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {company.name}
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {company.score}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <div />
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              <span>Stale</span>
              <span>Freshness</span>
              <span>Fresh</span>
            </div>
          </div>
        </div>
      </section>

      <div className="divide-y border-t">
        <SummaryRow label="Strong" value={counts.strong} tone="strong" />
        <SummaryRow label="Mixed" value={counts.mixed} tone="mixed" />
        <SummaryRow label="Weak" value={counts.weak} tone="weak" />
      </div>
    </div>
  );
}

function TabHeader({ active, inactive }: { readonly active: string; readonly inactive: string }) {
  return (
    <div
      data-slot="portfolio-dashboard-tabs"
      className="flex gap-6 border-b px-5 text-sm font-medium"
    >
      <div className="border-b border-foreground py-3 text-foreground">{active}</div>
      <div className="py-3 text-muted-foreground">{inactive}</div>
    </div>
  );
}

function SummaryRow({
  label,
  tone,
  value,
}: {
  readonly label: string;
  readonly tone: Tone;
  readonly value: number;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 text-sm">
      <div className="flex min-w-0 items-center gap-3 font-medium">
        <span className={`size-2 rounded-full ${toneClassName[tone]}`} />
        {label}
      </div>
      <div className="text-right text-muted-foreground tabular-nums">{value}</div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      data-slot="portfolio-dashboard-loading"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="border-b p-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      </div>
      <div className="p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

function DashboardError() {
  return (
    <Empty data-slot="portfolio-dashboard-error" className="min-h-96 border border-destructive/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">!</EmptyMedia>
        <EmptyTitle>Dashboard could not be loaded</EmptyTitle>
        <EmptyDescription>
          Check the server logs and confirm the company list is available.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function DashboardEmpty({ companyCount }: { readonly companyCount: number }) {
  return (
    <Empty data-slot="portfolio-dashboard-empty" className="min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">C</EmptyMedia>
        <EmptyTitle>No scored companies yet</EmptyTitle>
        <EmptyDescription>
          {companyCount === 0
            ? "Add companies to start building the portfolio map."
            : "Run checks on your companies to populate scores in the dashboard."}
        </EmptyDescription>
      </EmptyHeader>
      <Link
        to="/company"
        className="mt-5 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
      >
        Go to companies
      </Link>
    </Empty>
  );
}

function toDashboardCompanies(companies: ReadonlyArray<Company>): ReadonlyArray<DashboardCompany> {
  const scored = companies.filter((company) => company.score !== null);
  const updatedAtValues = scored.map((company) => company.updatedAt);
  const minUpdatedAt = Math.min(...updatedAtValues);
  const maxUpdatedAt = Math.max(...updatedAtValues);
  const updatedAtRange = maxUpdatedAt - minUpdatedAt;

  return scored.map((company) => ({
    id: company.id,
    name: company.name,
    score: company.score ?? 0,
    x: updatedAtRange === 0 ? 50 : 15 + ((company.updatedAt - minUpdatedAt) / updatedAtRange) * 70,
    y: Math.max(5, Math.min(company.score ?? 0, 95)),
    tone: getTone(company),
  }));
}

function getTone(company: Company): Tone {
  if (company.score === null || company.riskLevel === "unknown") return "mixed";
  if (company.riskLevel === "low" || company.score >= 80) return "strong";
  if (company.score < 45 || company.riskLevel === "high") return "weak";
  return "mixed";
}

function getToneCounts(companies: ReadonlyArray<DashboardCompany>) {
  return companies.reduce(
    (counts, company) => ({ ...counts, [company.tone]: counts[company.tone] + 1 }),
    { mixed: 0, strong: 0, weak: 0 },
  );
}

function getStrongest(companies: ReadonlyArray<DashboardCompany>) {
  return [...companies].sort((left, right) => right.score - left.score)[0];
}
