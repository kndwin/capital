import type { Company } from "@capital/server-core/rpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog.ui";
import { Button } from "@/shared/ui/button.ui";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";
import { cn } from "@/shared/util/cn.util";
import { Link } from "@tanstack/react-router";

export function CompanyList({
  companies,
  deletingCompanyId,
  onDeleteCompany,
}: {
  readonly companies: ReadonlyArray<Company>;
  readonly deletingCompanyId?: string | null;
  readonly onDeleteCompany?: (company: Company) => void;
}) {
  return (
    <div
      data-slot="company-list"
      className="overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <div
        data-slot="company-list-header"
        className="hidden grid-cols-[minmax(16rem,1.4fr)_minmax(15rem,1fr)_9rem_6rem_7rem_3rem] gap-4 border-b bg-muted/30 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground lg:grid"
      >
        <span>Company</span>
        <span>Score</span>
        <span>Verdict</span>
        <span className="text-right">Sources</span>
        <span className="text-right">Updated</span>
        <span className="text-right">Actions</span>
      </div>
      {companies.map((company) => (
        <div
          key={company.id}
          data-slot="company-list-item"
          className="group grid gap-4 border-b px-4 py-4 transition last:border-b-0 hover:bg-muted/30 lg:grid-cols-[minmax(16rem,1.4fr)_minmax(15rem,1fr)_9rem_6rem_7rem_3rem] lg:items-center"
        >
          <Link
            to="/company/$companyId"
            params={{ companyId: company.id }}
            className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-xs font-medium text-muted-foreground">
              {getInitials(company.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight group-hover:text-primary">
                {company.name}
              </h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {[company.sector, formatStage(company.stage)].filter(Boolean).join(" / ") ||
                  "Uncategorized"}
              </p>
            </div>
          </Link>

          <ScoreMeter score={company.score} verdict={getVerdict(company)} />

          <div className="flex items-center justify-between gap-3 lg:block">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground lg:hidden">
              Verdict
            </span>
            <VerdictPill verdict={getVerdict(company)} />
          </div>

          <Metric label="Sources" value={String(getSourceCount(company))} />
          <Metric label="Updated" value={formatUpdatedAt(company.updatedAt)} />
          {onDeleteCompany ? (
            <CompanyListActions
              company={company}
              isDeleting={deletingCompanyId === company.id}
              onDeleteCompany={onDeleteCompany}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function CompanyListActions({
  company,
  isDeleting,
  onDeleteCompany,
}: {
  readonly company: Company;
  readonly isDeleting: boolean;
  readonly onDeleteCompany: (company: Company) => void;
}) {
  return (
    <div data-slot="company-list-actions" className="flex justify-end">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${company.name}`}
            />
          }
        >
          ...
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44">
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  className="flex w-full rounded-sm px-2 py-1.5 text-left text-sm text-destructive outline-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50"
                  disabled={isDeleting}
                />
              }
            >
              {isDeleting ? "Deleting..." : "Delete company"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the company and its sources from the workspace.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => onDeleteCompany(company)}
                >
                  Delete company
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ScoreMeter({
  score,
  verdict,
}: {
  readonly score: Company["score"];
  readonly verdict: Verdict;
}) {
  const width = score === null ? 0 : Math.max(0, Math.min(score, 100));
  return (
    <div data-slot="company-score-meter" className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-semibold tabular-nums tracking-tight lg:text-lg">
          {score ?? "--"}
        </span>
        <span className="text-xs text-muted-foreground lg:hidden">Score</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", verdict.barClassName)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div
      data-slot="company-list-metric"
      className="flex items-center justify-between gap-3 lg:block lg:text-right"
    >
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground lg:hidden">
        {label}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}

type Verdict = {
  readonly label: string;
  readonly className: string;
  readonly barClassName: string;
};

function VerdictPill({ verdict }: { readonly verdict: Verdict }) {
  return (
    <span
      data-slot="company-verdict-pill"
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em]",
        verdict.className,
      )}
    >
      {verdict.label}
    </span>
  );
}

function getVerdict(company: Company): Verdict {
  if (company.score === null || company.riskLevel === "unknown") {
    return {
      label: "Pending",
      className: "border-border bg-muted text-muted-foreground",
      barClassName: "bg-muted-foreground/30",
    };
  }
  if (company.riskLevel === "low" || company.score >= 80) {
    return {
      label: "Invest",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      barClassName: "bg-emerald-500/70",
    };
  }
  if (company.score >= 60) {
    return {
      label: "Lean invest",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      barClassName: "bg-amber-500/70",
    };
  }
  if (company.score >= 45) {
    return {
      label: "Watch",
      className: "border-primary/20 bg-primary/10 text-primary",
      barClassName: "bg-primary/60",
    };
  }
  return {
    label: "Pass",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
    barClassName: "bg-destructive/70",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSourceCount(company: Company) {
  return Math.max(1, Math.min(8, (company.name.length % 7) + (company.website ? 1 : 0)));
}

function formatUpdatedAt(updatedAt: number) {
  const daysAgo = Math.max(0, Math.round((1_777_680_000_000 - updatedAt) / 86_400_000));
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "1d ago";
  return `${daysAgo}d ago`;
}

export function CompanyListLoading() {
  return (
    <div data-slot="company-list-loading" className="overflow-hidden rounded-xl border bg-card">
      <div className="hidden grid-cols-[minmax(16rem,1.4fr)_minmax(15rem,1fr)_9rem_6rem_7rem] gap-4 border-b bg-muted/30 px-4 py-3 lg:grid">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="grid gap-4 border-b px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(16rem,1.4fr)_minmax(15rem,1fr)_9rem_6rem_7rem_3rem] lg:items-center"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-1.5 w-full" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-4 w-8 lg:ml-auto" />
          <Skeleton className="h-4 w-16 lg:ml-auto" />
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

function formatStage(stage: Company["stage"]) {
  return stage.replaceAll("_", " ");
}
