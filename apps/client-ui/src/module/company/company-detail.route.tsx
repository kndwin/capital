import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import type {
  Company,
  CompanyDetail as CompanyDetailData,
  CompanyUpdateInput,
  MemoMaxPages,
  MemoRecord,
  MemoRenderInput,
} from "@capital/server-core/rpc";
import { generateMemoNarrative, memoListAtom, memoRenderPreviewAtom } from "../memo/memo.atom";
import {
  companyDetailAtom,
  createCompanySource,
  createCompanyWatchTarget,
  deleteCompany,
  retryCompanySource,
  updateCompany,
} from "./company.atom";
import {
  CompanyDetail,
  CompanyDetailError,
  CompanyDetailLoading,
  type CompanyEditDraft,
  type CompanySourceDraft,
  type CompanyWatchTargetDraft,
} from "./ui/company-detail.ui";
import { MemoPreview, MemoPreviewError, MemoPreviewLoading } from "./ui/memo-preview.ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { ModuleLayout, ModuleLayoutBody, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company/$companyId")({
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const companyDetail = React.useMemo(() => companyDetailAtom(companyId), [companyId]);
  const company = useAtomValue(companyDetail);
  const refreshCompanyDetail = useAtomRefresh(companyDetail);
  const createSource = useAtomSet(createCompanySource, { mode: "promiseExit" });
  const createWatchTarget = useAtomSet(createCompanyWatchTarget, { mode: "promiseExit" });
  const retrySource = useAtomSet(retryCompanySource, { mode: "promiseExit" });
  const update = useAtomSet(updateCompany, { mode: "promiseExit" });
  const deleteCompanyById = useAtomSet(deleteCompany, { mode: "promiseExit" });
  const navigate = useNavigate();
  const [leftPanel, setLeftPanel] = React.useState<"checks" | "history">("checks");
  const [rightPanel, setRightPanel] = React.useState<"sources" | "watch" | "memo">("sources");
  const [companyEditDraft, setCompanyEditDraft] = React.useState<CompanyEditDraft | null>(null);
  const [companyEditError, setCompanyEditError] = React.useState<string | null>(null);
  const [companyDeleteError, setCompanyDeleteError] = React.useState<string | null>(null);
  const [sourceDraft, setSourceDraft] = React.useState<CompanySourceDraft>({
    kind: "url",
    title: "",
    url: "",
    text: "",
    prompt: "",
    file: null,
  });
  const [sourceError, setSourceError] = React.useState<string | null>(null);
  const [watchTargetDraft, setWatchTargetDraft] = React.useState<CompanyWatchTargetDraft>({
    kind: "web_page",
    title: "",
    locator: "",
  });
  const [watchTargetError, setWatchTargetError] = React.useState<string | null>(null);
  const [isSavingCompany, startSaveCompanyTransition] = React.useTransition();
  const [isDeletingCompany, startDeleteCompanyTransition] = React.useTransition();
  const [isCreatingSource, startCreateSourceTransition] = React.useTransition();
  const [isCreatingWatchTarget, startCreateWatchTargetTransition] = React.useTransition();
  const [, startRetrySourceTransition] = React.useTransition();
  const [retryingSourceId, setRetryingSourceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const shouldPoll = AsyncResult.match(company, {
      onInitial: () => false,
      onFailure: () => false,
      onSuccess: (result) =>
        result.value.sources.some((source) => isSourceProcessing(source.status)),
    });
    if (!shouldPoll) return;

    const id = setInterval(refreshCompanyDetail, 2500);
    return () => clearInterval(id);
  }, [company, refreshCompanyDetail]);

  const handleEditCompany = (companyValue: Company) => {
    setCompanyEditError(null);
    setCompanyEditDraft(toCompanyEditDraft(companyValue));
  };

  const handleSaveCompany = () => {
    if (!companyEditDraft) return;

    setCompanyEditError(null);
    startSaveCompanyTransition(async () => {
      const exit = await update({
        payload: toCompanyUpdateInput(companyId, companyEditDraft),
        reactivityKeys: ["companies", `company:${companyId}`],
      });
      if (Exit.isFailure(exit)) {
        setCompanyEditError(Cause.pretty(exit.cause));
        return;
      }
      setCompanyEditDraft(null);
    });
  };

  const handleDeleteCompany = () => {
    setCompanyDeleteError(null);
    startDeleteCompanyTransition(async () => {
      const exit = await deleteCompanyById({
        payload: { id: companyId },
        reactivityKeys: ["companies", `company:${companyId}`],
      });
      if (Exit.isFailure(exit)) {
        setCompanyDeleteError(Cause.pretty(exit.cause));
        return;
      }
      await navigate({ to: "/company" });
    });
  };

  const handleCreateSource = () => {
    setSourceError(null);
    startCreateSourceTransition(async () => {
      const title = sourceDraft.title.trim() || null;
      const pdfContentBase64 =
        sourceDraft.kind === "pdf" && sourceDraft.file
          ? await readFileAsBase64(sourceDraft.file)
          : null;
      const exit = await createSource({
        payload:
          sourceDraft.kind === "url"
            ? {
                companyId,
                kind: "url",
                url: sourceDraft.url.trim(),
                title,
              }
            : sourceDraft.kind === "pdf" && sourceDraft.file && pdfContentBase64
              ? {
                  companyId,
                  kind: "pdf",
                  fileName: sourceDraft.file.name,
                  contentBase64: pdfContentBase64,
                  title,
                }
              : sourceDraft.kind === "chat"
                ? {
                    companyId,
                    kind: "chat",
                    prompt: sourceDraft.prompt.trim(),
                    title,
                  }
                : {
                    companyId,
                    kind: "note",
                    text: sourceDraft.text.trim(),
                    title,
                  },
        reactivityKeys: ["companies", `company:${companyId}`],
      });
      if (Exit.isFailure(exit)) {
        setSourceError(Cause.pretty(exit.cause));
        return;
      }
      setSourceDraft((draft) => ({
        ...draft,
        title: "",
        url: "",
        text: "",
        prompt: "",
        file: null,
      }));
    });
  };

  const handleRetrySource = (sourceId: string) => {
    setSourceError(null);
    setRetryingSourceId(sourceId);
    startRetrySourceTransition(async () => {
      const exit = await retrySource({
        payload: { companyId, sourceId },
        reactivityKeys: ["companies", `company:${companyId}`],
      });
      setRetryingSourceId(null);
      if (Exit.isFailure(exit)) {
        setSourceError(Cause.pretty(exit.cause));
      }
    });
  };

  const handleCreateWatchTarget = () => {
    setWatchTargetError(null);
    startCreateWatchTargetTransition(async () => {
      const exit = await createWatchTarget({
        payload: {
          companyId,
          kind: watchTargetDraft.kind,
          title: optionalText(watchTargetDraft.title),
          locator: watchTargetDraft.locator.trim(),
        },
        reactivityKeys: ["companies", `company:${companyId}`],
      });
      if (Exit.isFailure(exit)) {
        setWatchTargetError(Cause.pretty(exit.cause));
        return;
      }
      setWatchTargetDraft((draft) => ({ ...draft, title: "", locator: "" }));
    });
  };

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        {AsyncResult.match(company, {
          onInitial: () => <CompanyDetailBreadcrumb />,
          onFailure: () => <CompanyDetailBreadcrumb />,
          onSuccess: (result) => <CompanyDetailBreadcrumb company={result.value.company} />,
        })}
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(company, {
          onInitial: () => <CompanyDetailLoading />,
          onFailure: () => <CompanyDetailError />,
          onSuccess: (result) => (
            <CompanyDetailContent
              detail={result.value}
              companyEditDraft={companyEditDraft}
              companyEditError={companyEditError}
              companyDeleteError={companyDeleteError}
              isSavingCompany={isSavingCompany}
              isDeletingCompany={isDeletingCompany}
              onCompanyEditStart={() => handleEditCompany(result.value.company)}
              onCompanyEditCancel={() => {
                setCompanyEditDraft(null);
                setCompanyEditError(null);
              }}
              onCompanyEditChange={setCompanyEditDraft}
              onCompanyEditSubmit={handleSaveCompany}
              onCompanyDelete={handleDeleteCompany}
              sourceDraft={sourceDraft}
              sourceError={sourceError}
              watchTargetDraft={watchTargetDraft}
              watchTargetError={watchTargetError}
              isCreatingSource={isCreatingSource}
              isCreatingWatchTarget={isCreatingWatchTarget}
              onSourceDraftChange={setSourceDraft}
              onSourceSubmit={handleCreateSource}
              onWatchTargetDraftChange={setWatchTargetDraft}
              onWatchTargetSubmit={handleCreateWatchTarget}
              retryingSourceId={retryingSourceId}
              onSourceRetry={handleRetrySource}
              leftPanel={leftPanel}
              onLeftPanelChange={setLeftPanel}
              rightPanel={rightPanel}
              onRightPanelChange={setRightPanel}
            />
          ),
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}

function isSourceProcessing(status: CompanyDetailData["sources"][number]["status"]): boolean {
  return status === "pending" || status === "acquiring" || status === "extracting";
}

function CompanyDetailContent({
  detail,
  companyEditDraft,
  companyEditError,
  companyDeleteError,
  isSavingCompany,
  isDeletingCompany,
  onCompanyEditStart,
  onCompanyEditCancel,
  onCompanyEditChange,
  onCompanyEditSubmit,
  onCompanyDelete,
  sourceDraft,
  sourceError,
  watchTargetDraft,
  watchTargetError,
  isCreatingSource,
  isCreatingWatchTarget,
  retryingSourceId,
  onSourceDraftChange,
  onSourceSubmit,
  onWatchTargetDraftChange,
  onWatchTargetSubmit,
  onSourceRetry,
  leftPanel,
  onLeftPanelChange,
  rightPanel,
  onRightPanelChange,
}: {
  readonly detail: CompanyDetailData;
  readonly companyEditDraft: CompanyEditDraft | null;
  readonly companyEditError: string | null;
  readonly companyDeleteError: string | null;
  readonly isSavingCompany: boolean;
  readonly isDeletingCompany: boolean;
  readonly onCompanyEditStart: () => void;
  readonly onCompanyEditCancel: () => void;
  readonly onCompanyEditChange: (draft: CompanyEditDraft | null) => void;
  readonly onCompanyEditSubmit: () => void;
  readonly onCompanyDelete: () => void;
  readonly sourceDraft: CompanySourceDraft;
  readonly sourceError: string | null;
  readonly watchTargetDraft: CompanyWatchTargetDraft;
  readonly watchTargetError: string | null;
  readonly isCreatingSource: boolean;
  readonly isCreatingWatchTarget: boolean;
  readonly retryingSourceId: string | null;
  readonly onSourceDraftChange: (draft: CompanySourceDraft) => void;
  readonly onSourceSubmit: () => void;
  readonly onWatchTargetDraftChange: (draft: CompanyWatchTargetDraft) => void;
  readonly onWatchTargetSubmit: () => void;
  readonly onSourceRetry: (sourceId: string) => void;
  readonly leftPanel: "checks" | "history";
  readonly onLeftPanelChange: (panel: "checks" | "history") => void;
  readonly rightPanel: "sources" | "watch" | "memo";
  readonly onRightPanelChange: (panel: "sources" | "watch" | "memo") => void;
}) {
  const [selectedMemoId, setSelectedMemoId] = React.useState<string | null>(null);
  const [maxPages, setMaxPages] = React.useState<MemoMaxPages>(1);
  const [narrativeError, setNarrativeError] = React.useState<string | null>(null);
  const [isGeneratingNarrative, startGenerateNarrativeTransition] = React.useTransition();
  const generateNarrative = useAtomSet(generateMemoNarrative, { mode: "promiseExit" });
  const memoListRef = React.useMemo(() => memoListAtom(detail.company.id), [detail.company.id]);
  const memoList = useAtomValue(memoListRef);
  const refreshMemoList = useAtomRefresh(memoListRef);

  React.useEffect(() => {
    setSelectedMemoId(null);
    setNarrativeError(null);
  }, [detail.company.id]);

  const memoRecords = React.useMemo<readonly MemoRecord[]>(
    () =>
      AsyncResult.match(memoList, {
        onInitial: () => [],
        onFailure: () => [],
        onSuccess: (result) => result.value,
      }),
    [memoList],
  );

  const activeMemo = React.useMemo<MemoRecord | null>(() => {
    if (memoRecords.length === 0) return null;
    if (selectedMemoId === null) return memoRecords[0] ?? null;
    return memoRecords.find((record) => record.id === selectedMemoId) ?? memoRecords[0] ?? null;
  }, [memoRecords, selectedMemoId]);

  const baseMemoInput = React.useMemo(() => toMemoRenderInput(detail), [detail]);
  const memoInput = React.useMemo<MemoRenderInput>(() => {
    if (activeMemo === null) return baseMemoInput;
    return {
      ...baseMemoInput,
      maxPages: activeMemo.config.maxPages,
      summary: {
        headline: activeMemo.narrative.headline,
        thesis: activeMemo.narrative.thesis,
        executiveSummary: activeMemo.narrative.executiveSummary,
        keyTakeaways: activeMemo.narrative.keyTakeaways,
        upside: activeMemo.narrative.upside,
        risks: activeMemo.narrative.risks,
      },
    };
  }, [baseMemoInput, activeMemo]);
  const memoPreview = useAtomValue(memoRenderPreviewAtom(memoInput));

  const handleGenerateNarrative = () => {
    setNarrativeError(null);
    startGenerateNarrativeTransition(async () => {
      const exit = await generateNarrative({
        payload: { input: baseMemoInput, config: { maxPages } },
        reactivityKeys: [`memo:${detail.company.id}`],
      });
      if (Exit.isFailure(exit)) {
        setNarrativeError(Cause.pretty(exit.cause));
        return;
      }
      setSelectedMemoId(exit.value.id);
      refreshMemoList();
    });
  };

  const memoPanel = AsyncResult.match(memoPreview, {
    onInitial: () => <MemoPreviewLoading />,
    onFailure: () => <MemoPreviewError />,
    onSuccess: (result) => (
      <MemoPreview
        html={result.value.html}
        records={memoRecords}
        activeMemoId={activeMemo?.id ?? null}
        onSelectMemo={setSelectedMemoId}
        maxPages={maxPages}
        onMaxPagesChange={setMaxPages}
        isGenerating={isGeneratingNarrative}
        error={narrativeError}
        onGenerate={handleGenerateNarrative}
      />
    ),
  });

  return (
    <CompanyDetail
      detail={detail}
      companyEditDraft={companyEditDraft ?? undefined}
      companyEditError={companyEditError}
      companyDeleteError={companyDeleteError}
      isEditingCompany={companyEditDraft !== null}
      isSavingCompany={isSavingCompany}
      isDeletingCompany={isDeletingCompany}
      onCompanyEditStart={onCompanyEditStart}
      onCompanyEditCancel={onCompanyEditCancel}
      onCompanyEditChange={onCompanyEditChange}
      onCompanyEditSubmit={onCompanyEditSubmit}
      onCompanyDelete={onCompanyDelete}
      sourceDraft={sourceDraft}
      sourceError={sourceError}
      watchTargetDraft={watchTargetDraft}
      watchTargetError={watchTargetError}
      isCreatingSource={isCreatingSource}
      isCreatingWatchTarget={isCreatingWatchTarget}
      retryingSourceId={retryingSourceId}
      onSourceDraftChange={onSourceDraftChange}
      onSourceSubmit={onSourceSubmit}
      onWatchTargetDraftChange={onWatchTargetDraftChange}
      onWatchTargetSubmit={onWatchTargetSubmit}
      onSourceRetry={onSourceRetry}
      leftPanel={leftPanel}
      onLeftPanelChange={onLeftPanelChange}
      rightPanel={rightPanel}
      onRightPanelChange={onRightPanelChange}
      memoPanel={memoPanel}
    />
  );
}

function toCompanyEditDraft(company: Company): CompanyEditDraft {
  return {
    name: company.name,
    description: company.description ?? "",
    website: company.website ?? "",
    stage: company.stage,
    sector: company.sector ?? "",
    location: company.location ?? "",
    riskLevel: company.riskLevel,
  };
}

function toCompanyUpdateInput(id: string, draft: CompanyEditDraft): CompanyUpdateInput {
  return {
    id,
    name: draft.name.trim(),
    description: optionalText(draft.description),
    website: optionalText(draft.website),
    stage: draft.stage,
    sector: optionalText(draft.sector),
    location: optionalText(draft.location),
    riskLevel: draft.riskLevel,
  };
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toMemoRenderInput(detail: CompanyDetailData): MemoRenderInput {
  const insightById = new Map(detail.insights.map((insight) => [insight.id, insight]));
  return {
    maxPages: null,
    generatedAt: detail.company.updatedAt,
    company: {
      id: detail.company.id,
      name: detail.company.name,
      stage: detail.company.stage,
      sector: detail.company.sector,
      location: detail.company.location,
      description: detail.company.description,
      website: detail.company.website,
      score: detail.company.score,
      recommendation: recommendationFromScore(detail.company.score),
    },
    summary: {
      headline: `${detail.company.name} has ${summaryPosture(detail.company.score)} based on current evidence.`,
      executiveSummary: null,
      thesis:
        detail.company.description ??
        "The memo is generated from the checks, sources, and extracted insights currently available for this company.",
      keyTakeaways: detail.checkGroups.slice(0, 3).map(groupSummary),
      upside: detail.checkGroups
        .filter((group) => group.verdict === "strong")
        .slice(0, 3)
        .map(groupSummary),
      risks: detail.checkGroups
        .filter((group) => group.verdict !== "strong")
        .slice(0, 3)
        .map(groupSummary),
    },
    checkGroups: detail.checkGroups.map((group) => ({
      id: group.id,
      label: group.label,
      verdict: group.verdict,
      score: group.score,
      summary: groupSummary(group),
      checks: group.checks.map((check) => ({
        id: check.id,
        groupId: check.groupId,
        label: check.label,
        status: check.status,
        score: check.score,
        detail: check.detail,
        rationale: check.rationale,
        citations: check.supportingInsightIds.map((insightId) => {
          const insight = insightById.get(insightId);
          return {
            sourceId: insight?.sourceId ?? insightId,
            label: insight?.text.slice(0, 80) ?? insightId,
            locator: insight?.locator ?? null,
          };
        }),
      })),
    })),
    sources: detail.sources.flatMap((source) =>
      source.kind === "chat"
        ? []
        : [
            {
              id: source.id,
              kind: source.kind,
              title: source.title,
              subtitle: source.subtitle,
              confidence: source.confidence,
            },
          ],
    ),
    insights: detail.insights.map((insight) => ({
      id: insight.id,
      sourceId: insight.sourceId,
      kind: insight.kind,
      locator: insight.locator,
      text: insight.text,
      linkedCheckIds: detail.checkGroups.flatMap((group) =>
        group.checks
          .filter((check) => check.supportingInsightIds.includes(insight.id))
          .map((check) => check.id),
      ),
    })),
  };
}

function groupSummary(group: CompanyDetailData["checkGroups"][number]): string {
  const resolvedChecks = group.checks.filter((check) => check.status !== "unknown").length;
  return `${group.label} is ${group.verdict} with ${resolvedChecks} of ${group.checks.length} checks resolved.`;
}

function recommendationFromScore(
  score: number | null,
): MemoRenderInput["company"]["recommendation"] {
  if (score === null) return "needs_work";
  if (score >= 75) return "lean_in";
  if (score >= 50) return "watch";
  return "pass";
}

function summaryPosture(score: number | null): string {
  if (score === null) return "an incomplete investment read";
  if (score >= 75) return "a strong investment read";
  if (score >= 50) return "a watch-list investment read";
  return "material unresolved concerns";
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("Failed to read file")),
    );
    reader.readAsDataURL(file);
  });
}

function CompanyDetailBreadcrumb({ company }: { readonly company?: Company }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/company" />}>Companies</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{company?.name ?? "Company"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
