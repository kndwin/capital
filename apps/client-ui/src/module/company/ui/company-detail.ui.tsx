import type { Company } from "@capital/server-core/rpc";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";

export function CompanyDetail({ company }: { readonly company: Company }) {
  return (
    <div data-slot="company-detail" className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Diligence target
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{company.name}</h2>
            <p className="max-w-3xl text-sm/6 text-muted-foreground">
              {company.description ?? "No company summary has been extracted yet."}
            </p>
          </div>
          <div className="rounded-xl border bg-background p-4 text-center">
            <div className="text-3xl font-semibold">{company.score ?? "--"}</div>
            <div className="mt-1 text-xs text-muted-foreground">Current score</div>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Stage" value={company.stage.replaceAll("_", " ")} />
          <Fact label="Sector" value={company.sector ?? "Unknown"} />
          <Fact label="Location" value={company.location ?? "Unknown"} />
          <Fact label="Risk" value={company.riskLevel} />
        </dl>
      </section>

      <section className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm">
        <h3 className="text-sm font-semibold">Source coverage</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Placeholder label="Documents" value="Pitch deck pending" />
          <Placeholder
            label="Extracted facts"
            value="Team, market, and traction will appear here"
          />
          <Placeholder label="Inconsistencies" value="No conflicts evaluated yet" />
          <Placeholder label="Risks" value="Risk flags will be attached to source evidence" />
        </div>
      </section>
    </div>
  );
}

export function CompanyDetailLoading() {
  return (
    <div
      data-slot="company-detail-loading"
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-4 h-16 w-full" />
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-40 w-full" />
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

function Fact({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div data-slot="company-detail-fact" className="rounded-lg border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}

function Placeholder({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div data-slot="company-detail-placeholder" className="rounded-lg border bg-background p-3">
      <div className="font-medium">{label}</div>
      <div className="mt-1 text-muted-foreground">{value}</div>
    </div>
  );
}
