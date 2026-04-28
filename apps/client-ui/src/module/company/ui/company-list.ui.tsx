import type { Company } from "@capital/server-core/rpc";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";

export type CompanyListItem = {
  readonly company: Company;
  readonly detailHref: string;
};

export function CompanyList({ companies }: { readonly companies: ReadonlyArray<CompanyListItem> }) {
  return (
    <div data-slot="company-list" className="grid gap-3 lg:grid-cols-2">
      {companies.map(({ company, detailHref }) => (
        <a
          key={company.id}
          data-slot="company-list-item"
          href={detailHref}
          className="group rounded-xl border bg-card p-4 text-card-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="truncate text-sm font-semibold tracking-tight">{company.name}</h2>
              <p className="text-xs text-muted-foreground">
                {[company.sector, formatStage(company.stage), company.location]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            </div>
            <RiskPill riskLevel={company.riskLevel} />
          </div>
          <p className="mt-4 line-clamp-2 text-sm/6 text-muted-foreground">
            {company.description ?? "No company summary has been extracted yet."}
          </p>
          <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span>Score {company.score ?? "pending"}</span>
            <span className="font-medium text-primary group-hover:underline">Open detail</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function CompanyListLoading() {
  return (
    <div data-slot="company-list-loading" className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-xl border bg-card p-4 shadow-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-3 w-64" />
          <Skeleton className="mt-6 h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function CompanyListEmpty() {
  return (
    <Empty data-slot="company-list-empty" className="min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">C</EmptyMedia>
        <EmptyTitle>No companies yet</EmptyTitle>
        <EmptyDescription>
          Run the seed command after pushing the database schema to add sample diligence targets.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function CompanyListError() {
  return (
    <Empty data-slot="company-list-error" className="min-h-96 border border-destructive/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">!</EmptyMedia>
        <EmptyTitle>Companies could not be loaded</EmptyTitle>
        <EmptyDescription>
          Check the server logs and confirm the company table exists.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function RiskPill({ riskLevel }: { readonly riskLevel: Company["riskLevel"] }) {
  const tone =
    riskLevel === "low"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : riskLevel === "high"
        ? "border-destructive/20 bg-destructive/10 text-destructive"
        : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return (
    <span
      data-slot="company-risk-pill"
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {riskLevel}
    </span>
  );
}

function formatStage(stage: Company["stage"]) {
  return stage.replaceAll("_", " ");
}
