import type {
  CompanyCheck,
  CompanyCheckGroup,
  CompanyDetail as CompanyDetailData,
  CompanySource,
  CompanySourceInsight,
} from "@capital/server-core/rpc";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";
import { cn } from "@/shared/util/cn.util";

export function CompanyDetail({ detail }: { readonly detail: CompanyDetailData }) {
  const { company, checkGroups, sources, insights } = detail;
  const resolved = checkGroups.reduce(
    (count, group) => count + group.checks.filter((check) => check.status !== "unknown").length,
    0,
  );
  const total = checkGroups.reduce((count, group) => count + group.checks.length, 0);
  const selectedSource = sources.find((source) => source.selected) ?? sources[0];
  const selectedInsight =
    insights.find((insight) => insight.sourceId === selectedSource?.id) ?? insights[0];

  return (
    <div
      data-slot="company-detail"
      className="overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <header data-slot="company-detail-header" className="border-b p-5 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {company.stage} · {company.sector ?? "Uncategorized"}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">{company.name}</h2>
            <p className="max-w-3xl text-base font-medium text-muted-foreground">
              {company.description ?? "No company summary has been extracted yet."}
            </p>
            <p className="text-sm text-muted-foreground">
              {resolved} of {total} checks resolved · {sources.length} sources · 2 changes today
            </p>
          </div>
          <div data-slot="company-detail-composite" className="text-left lg:text-right">
            <div className="text-6xl font-light tabular-nums tracking-tight">
              {company.score ?? "--"}
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Composite
            </div>
            <div className="mt-2 text-sm font-medium text-primary">Lean invest -&gt;</div>
          </div>
        </div>
      </header>

      <div className="grid min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.48fr)]">
        <section data-slot="company-detail-checks" className="border-b lg:border-b-0 lg:border-r">
          <TabHeader active="Checks" inactive="History" />
          <div className="divide-y">
            {checkGroups.length === 0 ? (
              <EmptyPanel
                title="No checks yet"
                description="Seed checks to populate the diligence view."
              />
            ) : (
              checkGroups.map((group) => <CheckGroupView key={group.id} group={group} />)
            )}
          </div>
        </section>

        <aside data-slot="company-detail-sources" className="min-w-0">
          <TabHeader active="Sources" inactive="Memo" />
          <div className="border-b p-4">
            <div className="rounded-lg border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
              + drop file or paste URL
            </div>
          </div>
          <div className="divide-y">
            {sources.length === 0 ? (
              <EmptyPanel title="No sources yet" description="Add a source to show evidence." />
            ) : (
              sources.map((source) => <SourceView key={source.id} source={source} />)
            )}
          </div>
          {selectedInsight ? (
            <InsightView insight={selectedInsight} source={selectedSource} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TabHeader({ active, inactive }: { readonly active: string; readonly inactive: string }) {
  return (
    <div data-slot="company-detail-tabs" className="flex gap-6 border-b px-5 text-sm font-medium">
      <div className="border-b border-foreground py-3 text-foreground">{active}</div>
      <div className="py-3 text-muted-foreground">{inactive}</div>
    </div>
  );
}

function CheckGroupView({ group }: { readonly group: CompanyCheckGroup }) {
  return (
    <div data-slot="company-detail-check-group" className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-semibold">{group.label}</h3>
        <div className={cn("text-sm font-medium", verdictClassName(group.verdict))}>
          {capitalize(group.verdict)} {group.score ?? "--"}
        </div>
      </div>
      <div className="space-y-3">
        {group.checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}

function CheckRow({ check }: { readonly check: CompanyCheck }) {
  return (
    <div
      data-slot="company-detail-check"
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-sm"
    >
      <div className="flex min-w-0 items-center gap-3 font-medium">
        <span className={cn("size-2 rounded-full", statusDotClassName(check.status))} />
        <span className="truncate">{check.label}</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em]",
            sourceClassName(check.source),
          )}
        >
          {check.source}
        </span>
      </div>
      <div className="text-right text-muted-foreground">{check.detail ?? "--"}</div>
    </div>
  );
}

function SourceView({ source }: { readonly source: CompanySource }) {
  return (
    <div
      data-slot="company-detail-source"
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4",
        source.selected && "bg-muted/40",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
            {source.kind}
          </span>
          <h3 className="truncate text-sm font-semibold">{source.title}</h3>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">{source.subtitle}</p>
      </div>
      <div className="text-sm text-muted-foreground tabular-nums">{source.confidence}%</div>
    </div>
  );
}

function InsightView({
  insight,
  source,
}: {
  readonly insight: CompanySourceInsight;
  readonly source: CompanySource | undefined;
}) {
  return (
    <div data-slot="company-detail-insight" className="border-t p-5">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {insight.kind} · {source?.title ?? "Source"}
        {insight.locator ? `, ${insight.locator}` : ""}
      </div>
      <blockquote className="mt-3 rounded-lg bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
        “{insight.text}”
      </blockquote>
      <p className="mt-3 text-sm text-muted-foreground">
        Drove · <span className="font-medium text-foreground">ARR</span> · pass ·{" "}
        <span className="font-medium text-amber-600 dark:text-amber-300">
          Growth rate · concern
        </span>
      </p>
    </div>
  );
}

function EmptyPanel({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div data-slot="company-detail-empty-panel" className="p-5 text-sm">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-muted-foreground">{description}</div>
    </div>
  );
}

export function CompanyDetailLoading() {
  return (
    <div data-slot="company-detail-loading" className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.48fr)]">
        <div className="space-y-4 border-r p-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
        <div className="space-y-4 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CompanyDetailError() {
  return (
    <Empty data-slot="company-detail-error" className="min-h-96 border border-destructive/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">!</EmptyMedia>
        <EmptyTitle>Company could not be loaded</EmptyTitle>
        <EmptyDescription>
          The company may not exist, or the server could not read it.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function statusDotClassName(status: CompanyCheck["status"]) {
  switch (status) {
    case "pass":
      return "bg-emerald-500/70";
    case "concern":
      return "bg-amber-500/80";
    case "fail":
      return "bg-destructive/70";
    case "unknown":
      return "border border-muted-foreground bg-transparent";
  }
}

function verdictClassName(verdict: CompanyCheckGroup["verdict"]) {
  switch (verdict) {
    case "strong":
      return "text-emerald-600 dark:text-emerald-300";
    case "mixed":
      return "text-amber-600 dark:text-amber-300";
    case "weak":
      return "text-destructive";
    case "unknown":
      return "text-muted-foreground";
  }
}

function sourceClassName(source: CompanyCheck["source"]) {
  switch (source) {
    case "engine":
      return "border-primary/20 bg-primary/10 text-primary";
    case "override":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "seed":
      return "border-border bg-muted text-muted-foreground";
  }
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
