import * as React from "react";
import type {
  CompanyCheck,
  CompanyCheckGroup,
  CompanyDetail as CompanyDetailData,
  CompanyRiskLevel,
  CompanySource,
  CompanySourceInsight,
  CompanyStage,
} from "@capital/server-core/rpc";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog.ui";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Input } from "@/shared/ui/input.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";
import { cn } from "@/shared/util/cn.util";

export type CompanySourceDraft = {
  readonly kind: "url" | "note" | "pdf" | "chat";
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly prompt: string;
  readonly file: File | null;
};

export type CompanyWatchTargetDraft = {
  readonly kind: "web_page" | "x_profile";
  readonly title: string;
  readonly locator: string;
};

export type CompanyEditDraft = {
  readonly name: string;
  readonly description: string;
  readonly website: string;
  readonly stage: CompanyStage;
  readonly sector: string;
  readonly location: string;
  readonly riskLevel: CompanyRiskLevel;
};

export function CompanyDetail({
  detail,
  sourceDraft,
  sourceError,
  watchTargetDraft,
  watchTargetError,
  isCreatingSource,
  isCreatingWatchTarget,
  onSourceDraftChange,
  onSourceSubmit,
  onWatchTargetDraftChange,
  onWatchTargetSubmit,
  retryingSourceId,
  onSourceRetry,
  leftPanel = "checks",
  onLeftPanelChange,
  rightPanel = "sources",
  onRightPanelChange,
  memoPanel,
  companyEditDraft,
  companyEditError,
  companyDeleteError,
  isEditingCompany = false,
  isSavingCompany = false,
  isDeletingCompany = false,
  onCompanyEditStart,
  onCompanyEditCancel,
  onCompanyEditChange,
  onCompanyEditSubmit,
  onCompanyDelete,
}: {
  readonly detail: CompanyDetailData;
  readonly sourceDraft?: CompanySourceDraft;
  readonly sourceError?: string | null;
  readonly watchTargetDraft?: CompanyWatchTargetDraft;
  readonly watchTargetError?: string | null;
  readonly isCreatingSource?: boolean;
  readonly isCreatingWatchTarget?: boolean;
  readonly onSourceDraftChange?: (draft: CompanySourceDraft) => void;
  readonly onSourceSubmit?: () => void;
  readonly onWatchTargetDraftChange?: (draft: CompanyWatchTargetDraft) => void;
  readonly onWatchTargetSubmit?: () => void;
  readonly retryingSourceId?: string | null;
  readonly onSourceRetry?: (sourceId: string) => void;
  readonly leftPanel?: "checks" | "history";
  readonly onLeftPanelChange?: (panel: "checks" | "history") => void;
  readonly rightPanel?: "sources" | "watch" | "memo";
  readonly onRightPanelChange?: (panel: "sources" | "watch" | "memo") => void;
  readonly memoPanel?: React.ReactNode;
  readonly companyEditDraft?: CompanyEditDraft;
  readonly companyEditError?: string | null;
  readonly companyDeleteError?: string | null;
  readonly isEditingCompany?: boolean;
  readonly isSavingCompany?: boolean;
  readonly isDeletingCompany?: boolean;
  readonly onCompanyEditStart?: () => void;
  readonly onCompanyEditCancel?: () => void;
  readonly onCompanyEditChange?: (draft: CompanyEditDraft) => void;
  readonly onCompanyEditSubmit?: () => void;
  readonly onCompanyDelete?: () => void;
}) {
  const layoutRef = React.useRef<HTMLDivElement>(null);
  const [rightPanelWidth, setRightPanelWidth] = React.useState(34);
  const [expandedSourceId, setExpandedSourceId] = React.useState<string | null>(null);
  const [previewSource, setPreviewSource] = React.useState<CompanySource | null>(null);
  const { company, checkGroups, sources, insights, history } = detail;
  const watchTargetItems = detail.watchTargets.map((entry) => entry.target);
  const activeWatchTargets = watchTargetItems.filter((target) => target.status === "active");
  const resolved = checkGroups.reduce(
    (count, group) => count + group.checks.filter((check) => check.status !== "unknown").length,
    0,
  );
  const total = checkGroups.reduce((count, group) => count + group.checks.length, 0);
  const insightsBySourceId = React.useMemo(() => {
    const grouped = new Map<string, ReadonlyArray<CompanySourceInsight>>();
    for (const source of sources) {
      grouped.set(
        source.id,
        insights.filter((insight) => insight.sourceId === source.id),
      );
    }
    return grouped;
  }, [insights, sources]);
  const checks = React.useMemo(() => checkGroups.flatMap((group) => group.checks), [checkGroups]);
  const insightsById = React.useMemo(() => {
    const indexed = new Map<string, CompanySourceInsight>();
    for (const insight of insights) indexed.set(insight.id, insight);
    return indexed;
  }, [insights]);
  const sourcesById = React.useMemo(() => {
    const indexed = new Map<string, CompanySource>();
    for (const source of sources) indexed.set(source.id, source);
    return indexed;
  }, [sources]);

  const openSource = (source: CompanySource) => {
    if (source.kind === "url" && source.url) {
      window.open(toExternalUrl(source.url), "_blank", "noopener,noreferrer");
      return;
    }

    setPreviewSource(source);
  };

  return (
    <div
      data-slot="company-detail"
      className="overflow-hidden rounded-xl border bg-card text-card-foreground"
    >
      <header data-slot="company-detail-header" className="border-b p-5 lg:p-8">
        {isEditingCompany && companyEditDraft && onCompanyEditChange ? (
          <CompanyEditForm
            draft={companyEditDraft}
            error={companyEditError}
            isSaving={isSavingCompany}
            onChange={onCompanyEditChange}
            onCancel={onCompanyEditCancel}
            onSubmit={onCompanyEditSubmit}
          />
        ) : (
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
                {resolved} of {total} checks resolved · {sources.length} sources ·{" "}
                {activeWatchTargets.length} websites watched
              </p>
              {activeWatchTargets.length > 0 ? (
                <div
                  data-slot="company-detail-market-watch-badge"
                  className="flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                  Market watch active
                </div>
              ) : null}
            </div>
            <div data-slot="company-detail-composite" className="text-left lg:text-right">
              <div className="text-6xl font-light tabular-nums tracking-tight">
                {company.score ?? "--"}
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Composite
              </div>
              <div className="mt-2 text-sm font-medium text-primary">Lean invest -&gt;</div>
              <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                {onCompanyEditStart ? (
                  <Button type="button" size="sm" variant="secondary" onClick={onCompanyEditStart}>
                    Edit fields
                  </Button>
                ) : null}
                {onCompanyDelete ? (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isDeletingCompany}
                        />
                      }
                    >
                      {isDeletingCompany ? "Deleting..." : "Delete company"}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {company.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the company and its sources from the
                          workspace.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          type="button"
                          variant="destructive"
                          disabled={isDeletingCompany}
                          onClick={onCompanyDelete}
                        >
                          Delete company
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
              {companyDeleteError ? (
                <p className="mt-2 text-sm font-medium text-destructive">{companyDeleteError}</p>
              ) : null}
            </div>
          </div>
        )}
      </header>

      <div
        ref={layoutRef}
        className="relative grid min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,var(--company-detail-right-panel-width))]"
        style={
          { "--company-detail-right-panel-width": `${rightPanelWidth}%` } as React.CSSProperties
        }
      >
        <section data-slot="company-detail-checks" className="border-b lg:border-b-0 lg:border-r">
          <MainTabHeader active={leftPanel} onChange={onLeftPanelChange} />
          <div className="divide-y">
            {leftPanel === "history" ? (
              <HistoryPanel history={history} />
            ) : checkGroups.length === 0 ? (
              <EmptyPanel
                title="No checks yet"
                description="Checks will resolve as sources are processed."
              />
            ) : (
              checkGroups.map((group) => (
                <CheckGroupView
                  key={group.id}
                  group={group}
                  insightsById={insightsById}
                  sourcesById={sourcesById}
                />
              ))
            )}
          </div>
        </section>

        <button
          type="button"
          aria-label="Resize evidence panel"
          data-slot="company-detail-resize-handle"
          className="group absolute inset-y-0 z-10 hidden w-5 -translate-x-1/2 cursor-col-resize items-center justify-center lg:flex"
          style={{ left: `calc(100% - ${rightPanelWidth}%)` }}
          onPointerDown={(event) => {
            const layout = layoutRef.current;
            if (!layout) return;

            event.currentTarget.setPointerCapture(event.pointerId);
            const rect = layout.getBoundingClientRect();
            const updateWidth = (clientX: number) => {
              const rightWidth = rect.right - clientX;
              const percent = (rightWidth / rect.width) * 100;
              setRightPanelWidth(Math.min(55, Math.max(28, percent)));
            };

            updateWidth(event.clientX);

            const onPointerMove = (moveEvent: PointerEvent) => updateWidth(moveEvent.clientX);
            const onPointerUp = () => {
              window.removeEventListener("pointermove", onPointerMove);
              window.removeEventListener("pointerup", onPointerUp);
            };

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp, { once: true });
          }}
        >
          <span className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
        </button>

        <aside data-slot="company-detail-sources" className="min-w-0">
          <PanelTabHeader
            tabs={[
              { id: "sources", label: "Sources" },
              { id: "watch", label: "Watch" },
              { id: "memo", label: "Memo" },
            ]}
            active={rightPanel}
            onChange={onRightPanelChange}
          />
          {rightPanel === "sources" ? (
            <>
              {sourceDraft && onSourceDraftChange && onSourceSubmit ? (
                <SourceCreateForm
                  draft={sourceDraft}
                  error={sourceError}
                  isSubmitting={isCreatingSource}
                  onChange={onSourceDraftChange}
                  onSubmit={onSourceSubmit}
                />
              ) : null}
              <div className="divide-y">
                {sources.length === 0 ? (
                  <EmptyPanel title="No sources yet" description="Add a source to show evidence." />
                ) : (
                  sources.map((source) => (
                    <SourceView
                      key={source.id}
                      source={source}
                      insights={insightsBySourceId.get(source.id) ?? []}
                      checks={checks}
                      expanded={expandedSourceId === source.id}
                      onToggle={() =>
                        setExpandedSourceId((current) => (current === source.id ? null : source.id))
                      }
                      onOpen={openSource}
                      isRetrying={retryingSourceId === source.id}
                      onRetry={onSourceRetry}
                    />
                  ))
                )}
              </div>
            </>
          ) : rightPanel === "watch" ? (
            watchTargetDraft && onWatchTargetDraftChange && onWatchTargetSubmit ? (
              <WatchTargetsPanel
                targets={watchTargetItems}
                draft={watchTargetDraft}
                error={watchTargetError}
                isSubmitting={isCreatingWatchTarget}
                onChange={onWatchTargetDraftChange}
                onSubmit={onWatchTargetSubmit}
              />
            ) : (
              <EmptyPanel
                title="No watch controls"
                description="Watch controls are not available."
              />
            )
          ) : (
            (memoPanel ?? (
              <EmptyPanel title="No memo preview" description="Memo preview is not available." />
            ))
          )}
        </aside>
      </div>
      <SourcePreviewDialog
        source={previewSource}
        open={previewSource !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewSource(null);
        }}
      />
    </div>
  );
}

function CompanyEditForm({
  draft,
  error,
  isSaving,
  onChange,
  onCancel,
  onSubmit,
}: {
  readonly draft: CompanyEditDraft;
  readonly error?: string | null;
  readonly isSaving?: boolean;
  readonly onChange: (draft: CompanyEditDraft) => void;
  readonly onCancel?: () => void;
  readonly onSubmit?: () => void;
}) {
  const canSave = draft.name.trim().length > 0 && !isSaving;
  return (
    <form
      data-slot="company-detail-edit-form"
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) onSubmit?.();
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Edit company fields
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Company profile</h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!canSave}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Name
          <Input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.currentTarget.value })}
            disabled={isSaving}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Website
          <Input
            value={draft.website}
            onChange={(event) => onChange({ ...draft, website: event.currentTarget.value })}
            placeholder="https://company.com"
            disabled={isSaving}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Stage
          <CompanySelect
            value={draft.stage}
            onChange={(value) => onChange({ ...draft, stage: value as CompanyStage })}
            disabled={isSaving}
            options={companyStageOptions}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Risk level
          <CompanySelect
            value={draft.riskLevel}
            onChange={(value) => onChange({ ...draft, riskLevel: value as CompanyRiskLevel })}
            disabled={isSaving}
            options={companyRiskLevelOptions}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Sector
          <Input
            value={draft.sector}
            onChange={(event) => onChange({ ...draft, sector: event.currentTarget.value })}
            placeholder="Uncategorized"
            disabled={isSaving}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Location
          <Input
            value={draft.location}
            onChange={(event) => onChange({ ...draft, location: event.currentTarget.value })}
            placeholder="City, ST"
            disabled={isSaving}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium lg:col-span-2">
          Description
          <textarea
            data-slot="company-detail-edit-description"
            className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            value={draft.description}
            onChange={(event) => onChange({ ...draft, description: event.currentTarget.value })}
            placeholder="No company summary has been extracted yet."
            disabled={isSaving}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

function CompanySelect({
  value,
  onChange,
  disabled,
  options,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
}) {
  return (
    <select
      data-slot="company-detail-edit-select"
      className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function WatchTargetsPanel({
  targets,
  draft,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  readonly targets: ReadonlyArray<CompanyDetailData["watchTargets"][number]["target"]>;
  readonly draft: CompanyWatchTargetDraft;
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly onChange: (draft: CompanyWatchTargetDraft) => void;
  readonly onSubmit: () => void;
}) {
  const activeTargets = targets.filter((target) => target.status === "active");
  const canSubmit = draft.locator.trim().length > 0 && !isSubmitting;
  const placeholder =
    draft.kind === "x_profile"
      ? "@company or https://x.com/company"
      : "https://company.com/changelog";
  return (
    <section data-slot="company-detail-watch-targets" className="grid gap-3 border-b p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Watch targets</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Monitor websites and social profiles for new diligence signals.
          </p>
        </div>
        <span className="rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
          {activeTargets.length} active
        </span>
      </div>
      {activeTargets.length > 0 ? (
        <div className="space-y-2">
          {activeTargets.slice(0, 4).map((target) => (
            <div key={target.id} className="min-w-0 rounded-lg border bg-muted/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {target.kind === "x_profile" ? "X" : "Web"}
                </span>
                <div className="truncate text-sm font-medium">
                  {target.title ?? target.url ?? target.locator}
                </div>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {target.kind === "x_profile"
                  ? `@${target.locator}`
                  : (target.url ?? target.locator)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          No watch targets yet. Add a durable page or X profile to listen for market signals.
        </p>
      )}
      <form
        data-slot="company-detail-watch-target-create"
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div className="flex gap-2">
          <Button
            type="button"
            size="xs"
            variant={draft.kind === "web_page" ? "secondary" : "ghost"}
            onClick={() => onChange({ ...draft, kind: "web_page" })}
            disabled={isSubmitting}
          >
            Website
          </Button>
          <Button
            type="button"
            size="xs"
            variant={draft.kind === "x_profile" ? "secondary" : "ghost"}
            onClick={() => onChange({ ...draft, kind: "x_profile" })}
            disabled={isSubmitting}
          >
            X profile
          </Button>
        </div>
        <Input
          value={draft.title}
          onChange={(event) => onChange({ ...draft, title: event.currentTarget.value })}
          placeholder="Optional label, e.g. Changelog"
          disabled={isSubmitting}
        />
        <Button type="submit" size="sm" variant="secondary" disabled={!canSubmit}>
          {isSubmitting ? "Adding target..." : "Add watch target"}
        </Button>
        <Input
          value={draft.locator}
          onChange={(event) => onChange({ ...draft, locator: event.currentTarget.value })}
          placeholder={placeholder}
          disabled={isSubmitting}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </section>
  );
}

const companyStageOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "pre_seed", label: "Pre-seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "growth", label: "Growth" },
] as const;

const companyRiskLevelOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

function SourceCreateForm({
  draft,
  error,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  readonly draft: CompanySourceDraft;
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly onChange: (draft: CompanySourceDraft) => void;
  readonly onSubmit: () => void;
}) {
  const canSubmit =
    draft.kind === "url"
      ? draft.url.trim()
      : draft.kind === "pdf"
        ? draft.file
        : draft.kind === "chat"
          ? draft.prompt.trim()
          : draft.text.trim();
  return (
    <form
      data-slot="company-detail-source-create"
      className="grid gap-3 border-b p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <div className="flex gap-2">
        <Button
          type="button"
          size="xs"
          variant={draft.kind === "url" ? "secondary" : "ghost"}
          onClick={() => onChange({ ...draft, kind: "url" })}
          disabled={isSubmitting}
        >
          URL
        </Button>
        <Button
          type="button"
          size="xs"
          variant={draft.kind === "note" ? "secondary" : "ghost"}
          onClick={() => onChange({ ...draft, kind: "note" })}
          disabled={isSubmitting}
        >
          Note
        </Button>
        <Button
          type="button"
          size="xs"
          variant={draft.kind === "chat" ? "secondary" : "ghost"}
          onClick={() => onChange({ ...draft, kind: "chat" })}
          disabled={isSubmitting}
        >
          AI Research
        </Button>
        <Button
          type="button"
          size="xs"
          variant={draft.kind === "pdf" ? "secondary" : "ghost"}
          onClick={() => onChange({ ...draft, kind: "pdf" })}
          disabled={isSubmitting}
        >
          PDF
        </Button>
      </div>
      <Input
        value={draft.title}
        onChange={(event) => onChange({ ...draft, title: event.currentTarget.value })}
        placeholder="Optional title"
        disabled={isSubmitting}
      />
      {draft.kind === "url" ? (
        <Input
          value={draft.url}
          onChange={(event) => onChange({ ...draft, url: event.currentTarget.value })}
          placeholder="https://company.com"
          disabled={isSubmitting}
        />
      ) : draft.kind === "pdf" ? (
        <Input
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => onChange({ ...draft, file: event.currentTarget.files?.[0] ?? null })}
          disabled={isSubmitting}
        />
      ) : draft.kind === "chat" ? (
        <textarea
          data-slot="company-detail-source-chat"
          className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          value={draft.prompt}
          onChange={(event) => onChange({ ...draft, prompt: event.currentTarget.value })}
          placeholder="Ask AI what to research, for example: Find recent traction, customer signals, pricing, competitors, and founder background."
          disabled={isSubmitting}
        />
      ) : (
        <textarea
          data-slot="company-detail-source-note"
          className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          value={draft.text}
          onChange={(event) => onChange({ ...draft, text: event.currentTarget.value })}
          placeholder="Paste notes, transcript excerpts, or diligence observations"
          disabled={isSubmitting}
        />
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "Adding source..." : "+ add source"}
      </Button>
    </form>
  );
}

function MainTabHeader({
  active,
  onChange,
}: {
  readonly active: "checks" | "history";
  readonly onChange?: (panel: "checks" | "history") => void;
}) {
  const tabs = [
    { id: "checks", label: "Checks" },
    { id: "history", label: "History" },
  ] as const;
  return (
    <div data-slot="company-detail-tabs" className="flex gap-6 border-b px-5 text-sm font-medium">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "border-b py-3",
            active === tab.id
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground",
          )}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function HistoryPanel({ history }: { readonly history: CompanyDetailData["history"] }) {
  if (history.length === 0) {
    return (
      <EmptyPanel
        title="No history yet"
        description="Source-generated insights and affected checks will appear here."
      />
    );
  }

  return (
    <div data-slot="company-detail-history" className="space-y-0 p-5">
      {history.map((item) => (
        <article
          key={item.id}
          data-slot="company-detail-history-item"
          className="relative border-l border-border pb-8 pl-6 last:pb-0"
        >
          <span
            className={cn(
              "absolute -left-[0.3125rem] top-1 size-2.5 rounded-full border bg-background ring-4 ring-background",
              historyDotClassName(item.sourceStatus),
            )}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  {item.sourceKind}
                </span>
                <h3 className="truncate text-sm font-semibold">{item.sourceTitle}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {historyVerb(item.sourceStatus, item.insightCount)}
              </p>
            </div>
            <span
              className={cn(
                "w-fit rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em]",
                sourceStatusClassName(item.sourceStatus),
              )}
            >
              {item.sourceStatus}
            </span>
          </div>

          {item.insights.length > 0 ? (
            <div className="mt-4 space-y-3">
              {item.insights.slice(0, 3).map((insight) => (
                <blockquote
                  key={insight.id}
                  className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground"
                >
                  <span className="font-medium uppercase tracking-[0.12em] text-foreground text-[0.65rem]">
                    {insight.kind}
                    {insight.locator ? ` · ${insight.locator}` : ""}
                  </span>
                  <span className="mt-1 block">“{insight.text}”</span>
                </blockquote>
              ))}
            </div>
          ) : null}

          <div className="mt-4 rounded-lg border border-dashed p-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Affected checks
            </div>
            {item.affectedChecks.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.affectedChecks.map((check) => (
                  <span
                    key={check.id}
                    className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{check.label}</span> ·{" "}
                    {check.status}
                    {check.detail ? ` · ${check.detail}` : ""}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No checks linked yet.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function PanelTabHeader({
  tabs,
  active,
  onChange,
}: {
  readonly tabs: ReadonlyArray<{
    readonly id: "sources" | "watch" | "memo";
    readonly label: string;
  }>;
  readonly active: "sources" | "watch" | "memo";
  readonly onChange?: (panel: "sources" | "watch" | "memo") => void;
}) {
  return (
    <div data-slot="company-detail-tabs" className="flex gap-6 border-b px-5 text-sm font-medium">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "border-b py-3",
            active === tab.id
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground",
          )}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CheckGroupView({
  group,
  insightsById,
  sourcesById,
}: {
  readonly group: CompanyCheckGroup;
  readonly insightsById: ReadonlyMap<string, CompanySourceInsight>;
  readonly sourcesById: ReadonlyMap<string, CompanySource>;
}) {
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
          <CheckRow
            key={check.id}
            check={check}
            insightsById={insightsById}
            sourcesById={sourcesById}
          />
        ))}
      </div>
    </div>
  );
}

function CheckRow({
  check,
  insightsById,
  sourcesById,
}: {
  readonly check: CompanyCheck;
  readonly insightsById: ReadonlyMap<string, CompanySourceInsight>;
  readonly sourcesById: ReadonlyMap<string, CompanySource>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const evidence = check.supportingInsightIds.flatMap((insightId) => {
    const insight = insightsById.get(insightId);
    return insight ? [insight] : [];
  });

  return (
    <div
      data-slot="company-detail-check"
      className={cn(
        "rounded-lg border border-transparent text-sm",
        expanded && "border-border bg-muted/20",
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-lg px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="flex min-w-0 items-center gap-3 font-medium">
          <span className={cn("size-2 shrink-0 rounded-full", statusDotClassName(check.status))} />
          <span className="truncate">{check.label}</span>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em]",
              sourceClassName(check.source),
            )}
          >
            {check.source}
          </span>
        </span>
        <span className="text-right text-muted-foreground">{check.detail ?? "--"}</span>
        <span aria-hidden="true" className="w-4 text-center text-muted-foreground">
          {expanded ? "-" : "+"}
        </span>
      </button>
      {expanded ? (
        <div data-slot="company-detail-check-evidence" className="space-y-4 border-t px-8 py-5">
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Reason
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{check.rationale}</p>
          </div>
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Evidence
            </div>
            {evidence.length > 0 ? (
              <div className="mt-2 space-y-2">
                {evidence.map((insight) => (
                  <CheckEvidenceView
                    key={insight.id}
                    insight={insight}
                    source={sourcesById.get(insight.sourceId)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No supporting insights linked yet.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CheckEvidenceView({
  insight,
  source,
}: {
  readonly insight: CompanySourceInsight;
  readonly source: CompanySource | undefined;
}) {
  return (
    <blockquote
      data-slot="company-detail-check-evidence-item"
      className="rounded-lg border bg-background p-3"
    >
      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
        {source?.kind ?? "source"} · {source?.title ?? "Unknown source"}
        {insight.locator ? ` · ${insight.locator}` : ""}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">“{insight.text}”</p>
    </blockquote>
  );
}

function SourceView({
  source,
  insights,
  checks,
  expanded,
  onToggle,
  onOpen,
  isRetrying,
  onRetry,
}: {
  readonly source: CompanySource;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
  readonly checks: ReadonlyArray<CompanyCheck>;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onOpen: (source: CompanySource) => void;
  readonly isRetrying?: boolean;
  readonly onRetry?: (sourceId: string) => void;
}) {
  const progress = sourceProgress(source.status);
  const canOpen =
    source.kind === "url" ? Boolean(source.url) : Boolean(source.fileUrl ?? source.acquiredText);
  return (
    <div data-slot="company-detail-source" className={cn(expanded && "bg-muted/30")}>
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-4 transition-colors hover:bg-muted/30",
          source.selected && "bg-muted/40",
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {source.kind}
            </span>
            <h3 className="truncate text-sm font-semibold">{source.title}</h3>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{source.subtitle}</p>
          {progress ? <SourceProgress progress={progress} /> : null}
          {source.status === "failed" ? (
            <p className="mt-1 text-xs text-destructive">{source.error ?? "Source failed"}</p>
          ) : null}
        </button>
        <div className="flex items-start gap-2">
          {source.status === "failed" && onRetry ? (
            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={() => onRetry(source.id)}
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </Button>
          ) : null}
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => onOpen(source)}
            disabled={!canOpen}
          >
            {source.kind === "url" ? "Open" : "View"}
          </Button>
          <button
            type="button"
            aria-label={expanded ? "Collapse source insights" : "Expand source insights"}
            className="pt-0.5 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={onToggle}
          >
            {expanded ? "-" : "+"}
          </button>
          <span
            className={cn(
              "h-fit rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em]",
              sourceStatusClassName(source.status),
            )}
          >
            {sourceStatusLabel(source.status)}
          </span>
        </div>
      </div>
      {expanded ? <SourceInsights insights={insights} checks={checks} source={source} /> : null}
    </div>
  );
}

function SourcePreviewDialog({
  source,
  open,
  onOpenChange,
}: {
  readonly source: CompanySource | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const text = source?.acquiredText?.trim() ?? "";
  const pdfUrl = source?.kind === "pdf" ? source.fileUrl : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-14">
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {source?.kind ?? "source"}
            </span>
            <DialogTitle className="truncate">{source?.title ?? "Source"}</DialogTitle>
          </div>
          <DialogDescription>
            {source?.subtitle ?? sourcePreviewDescription(source)}
          </DialogDescription>
        </DialogHeader>
        {source?.kind === "pdf" && pdfUrl ? (
          <iframe
            data-slot="company-detail-source-pdf-preview"
            title={source.title}
            src={pdfUrl}
            className="h-[72vh] w-full bg-background"
          />
        ) : text ? (
          <div
            data-slot="company-detail-source-text-preview"
            className="max-h-[72vh] overflow-auto whitespace-pre-wrap p-5 text-sm leading-7 text-muted-foreground"
          >
            {text}
          </div>
        ) : (
          <div className="p-5">
            <EmptyPanel
              title="No source preview"
              description="This source does not have stored content available to preview yet."
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SourceInsights({
  insights,
  checks,
  source,
}: {
  readonly insights: ReadonlyArray<CompanySourceInsight>;
  readonly checks: ReadonlyArray<CompanyCheck>;
  readonly source: CompanySource;
}) {
  if (insights.length === 0) {
    const failed = source.status === "failed";
    return (
      <div data-slot="company-detail-source-insights-empty" className="border-t px-5 py-4 text-sm">
        <div className="font-medium">{failed ? "Source failed" : "No insights yet"}</div>
        <div className={cn("mt-1", failed ? "text-destructive" : "text-muted-foreground")}>
          {failed
            ? (source.error ?? "Source processing failed before insights could be extracted.")
            : "Insights will appear after this source is processed."}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="company-detail-source-insights" className="border-t">
      {insights.map((insight) => (
        <InsightView key={insight.id} insight={insight} checks={checks} source={source} />
      ))}
    </div>
  );
}

function SourceProgress({
  progress,
}: {
  readonly progress: { readonly label: string; readonly value: number };
}) {
  return (
    <div data-slot="company-detail-source-progress" className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
        <span>{progress.label}</span>
        <span>{progress.value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${progress.value}%` }}
        />
      </div>
    </div>
  );
}

function InsightView({
  insight,
  checks,
  source,
}: {
  readonly insight: CompanySourceInsight;
  readonly checks: ReadonlyArray<CompanyCheck>;
  readonly source: CompanySource | undefined;
}) {
  const linkedChecks = checks.filter((check) => check.supportingInsightIds.includes(insight.id));

  return (
    <div data-slot="company-detail-insight" className="border-t p-5 first:border-t-0">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {insight.kind} · {source?.title ?? "Source"}
        {insight.locator ? `, ${insight.locator}` : ""}
      </div>
      <blockquote className="mt-3 rounded-lg bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
        “{insight.text}”
      </blockquote>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Drove</span>
        {linkedChecks.length > 0 ? (
          linkedChecks.map((check) => (
            <span
              key={check.id}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs",
                checkStatusClassName(check.status),
              )}
            >
              <span className="font-medium">{check.label}</span> · {check.status}
              {check.detail ? ` · ${check.detail}` : ""}
            </span>
          ))
        ) : (
          <span>No checks linked yet.</span>
        )}
      </div>
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

function checkStatusClassName(status: CompanyCheck["status"]) {
  switch (status) {
    case "pass":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "concern":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "fail":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "unknown":
      return "border-border bg-background text-muted-foreground";
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
    case "definition":
      return "border-border bg-muted text-muted-foreground";
    case "engine":
      return "border-primary/20 bg-primary/10 text-primary";
    case "override":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "seed":
      return "border-border bg-muted text-muted-foreground";
  }
}

function sourceStatusClassName(status: CompanySource["status"]) {
  switch (status) {
    case "pending":
    case "acquiring":
    case "extracting":
      return "border-primary/20 bg-primary/10 text-primary";
    case "ready":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "failed":
      return "border-destructive/20 bg-destructive/10 text-destructive";
  }
}

function historyDotClassName(status: CompanySource["status"]) {
  switch (status) {
    case "pending":
    case "acquiring":
    case "extracting":
      return "border-primary bg-primary";
    case "ready":
      return "border-emerald-500 bg-emerald-500";
    case "failed":
      return "border-destructive bg-destructive";
  }
}

function sourceStatusLabel(status: CompanySource["status"]) {
  switch (status) {
    case "pending":
      return "Queued";
    case "acquiring":
      return "Fetching";
    case "extracting":
      return "Extracting";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
  }
}

function historyVerb(status: CompanySource["status"], insightCount: number) {
  switch (status) {
    case "pending":
      return "Queued for insight extraction.";
    case "acquiring":
      return "Fetching source content before insight extraction.";
    case "extracting":
      return "Extracting source insights.";
    case "failed":
      return "Source processing failed before checks could be updated.";
    case "ready":
      return `Generated ${insightCount} ${insightCount === 1 ? "insight" : "insights"} from this source.`;
  }
}

function sourceProgress(status: CompanySource["status"]) {
  switch (status) {
    case "pending":
      return { label: "queued", value: 15 };
    case "acquiring":
      return { label: "fetching source", value: 45 };
    case "extracting":
      return { label: "extracting insights", value: 75 };
    case "ready":
    case "failed":
      return null;
  }
}

function sourcePreviewDescription(source: CompanySource | null) {
  if (!source) return "Source preview";
  if (source.kind === "pdf") return "PDF preview";
  if (source.kind === "chat") return "AI research source text";
  if (source.kind === "note") return "Note source text";
  return "Source text";
}

function toExternalUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
