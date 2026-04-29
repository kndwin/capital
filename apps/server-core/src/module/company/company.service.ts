import { Clock, Context, Effect, Layer } from "effect";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanySourceIngestQueue } from "./company-source.queue";
import { ErrorCompanyNotFound } from "./company.error";
import { CompanyRepo } from "./company.repo";
import type {
  Company,
  CompanySourceCreateInput,
  CompanySourceRetryInput,
  CompanyDetail,
  CompanyCreateInput,
  CompanyHistoryAffectedCheck,
  CompanyHistoryItem,
  CompanySource,
  CompanySourceInsight,
  CompanyUpdateInput,
} from "./company.schema";
import { acquireNoteContent, hashSourceText, toCompanyId } from "./company.util";

const withModuleLogs = Effect.annotateLogs({ module: "company" });
const sourceUploadDir = path.resolve(process.cwd(), ".capital/uploads/company-sources");

export class CompanyService extends Context.Service<CompanyService>()("module/CompanyService", {
  make: Effect.gen(function* () {
    const repo = yield* CompanyRepo;
    const companyCheck = yield* CompanyCheckService;
    const sourceIngestQueue = yield* CompanySourceIngestQueue;

    const create = Effect.fn("CompanyService.create")(function* (input: CompanyCreateInput) {
      const now = yield* Clock.currentTimeMillis;
      const company: Company = {
        id: `${toCompanyId({ name: input.name })}-${now}`,
        name: input.name,
        description: input.description,
        website: input.website,
        stage: "unknown",
        sector: null,
        location: null,
        score: null,
        riskLevel: "unknown",
        updatedAt: now,
      };
      yield* Effect.annotateCurrentSpan({ "company.id": company.id });
      const created = yield* repo.upsert(company);
      if (input.source) {
        yield* createSource({ ...input.source, companyId: created.id });
      }
      yield* Effect.logInfo("company.created");
      return created;
    }, withModuleLogs);

    const upsert = Effect.fn("CompanyService.upsert")(function* (input: Company) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.id });
      const company = yield* repo.upsert(input);
      yield* Effect.logInfo("company.upserted");
      return company;
    }, withModuleLogs);

    const update = Effect.fn("CompanyService.update")(function* (input: CompanyUpdateInput) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.id });
      const existing = yield* repo.get(input.id);
      if (!existing) return yield* new ErrorCompanyNotFound({ id: input.id });

      const now = yield* Clock.currentTimeMillis;
      const company = yield* repo.upsert({
        ...existing,
        name: input.name,
        description: input.description,
        website: input.website,
        stage: input.stage,
        sector: input.sector,
        location: input.location,
        riskLevel: input.riskLevel,
        updatedAt: now,
      });
      yield* Effect.logInfo("company.updated");
      return company;
    }, withModuleLogs);

    const deleteCompany = Effect.fn("CompanyService.delete")(function* (id: string) {
      yield* Effect.annotateCurrentSpan({ "company.id": id });
      const existing = yield* repo.get(id);
      if (!existing) return yield* new ErrorCompanyNotFound({ id });

      yield* repo.delete(id);
      yield* Effect.logInfo("company.deleted");
    }, withModuleLogs);

    const upsertSource = Effect.fn("CompanyService.upsertSource")(function* (input: CompanySource) {
      return yield* repo.upsertSource(input);
    }, withModuleLogs);

    const createSource = Effect.fn("CompanyService.createSource")(function* (
      input: CompanySourceCreateInput,
    ) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.companyId });
      const company = yield* repo.get(input.companyId);
      if (!company) return yield* new ErrorCompanyNotFound({ id: input.companyId });

      const now = yield* Clock.currentTimeMillis;
      const order = yield* repo.nextSourceOrder(input.companyId);
      const sourceTitle =
        input.title?.trim() ||
        (input.kind === "url"
          ? input.url
          : input.kind === "pdf"
            ? input.fileName
            : input.kind === "chat"
              ? `${company.name} AI research`
              : `${company.name} note`);
      const sourceId = `${input.companyId}:${toCompanyId({ name: sourceTitle })}:${now}`;
      const fileUrl =
        input.kind === "pdf" ? yield* storePdfSource(sourceId, input.contentBase64) : null;
      const source: CompanySource = {
        id: sourceId,
        companyId: input.companyId,
        kind: input.kind,
        status: "pending",
        title: sourceTitle,
        subtitle:
          input.kind === "url"
            ? input.url
            : input.kind === "pdf"
              ? input.fileName
              : input.kind === "chat"
                ? input.prompt.trim().slice(0, 140) || "AI web research"
                : "manual note",
        confidence: 0,
        selected: false,
        order,
        url: input.kind === "url" ? input.url : null,
        fileName: input.kind === "pdf" ? input.fileName : null,
        fileUrl,
        acquiredProvider: null,
        acquiredText: null,
        acquiredTextTruncated: false,
        acquiredTextCharCount: null,
        acquiredTextHash: null,
        error: null,
        updatedAt: now,
      };
      const created = yield* repo.upsertSource(source);
      if (input.kind === "note") {
        yield* repo.updateSourceAcquiredContent({
          sourceId,
          content: acquireNoteContent({ text: input.text }),
        });
      }
      if (input.kind === "chat") {
        yield* repo.updateSourceAcquiredContent({
          sourceId,
          content: acquireNoteContent({ text: input.prompt }),
        });
      }
      if (input.kind === "pdf") {
        yield* repo.updateSourceAcquiredContent({
          sourceId,
          content: {
            provider: "openai_file",
            title: input.fileName,
            finalUrl: fileUrl,
            text: "",
            textCharCount: 0,
            textTruncated: false,
            textHash: hashSourceText({ text: fileUrl ?? input.fileName }),
          },
        });
      }
      yield* sourceIngestQueue.enqueue({
        companyId: input.companyId,
        sourceId,
        reason: "source_created",
      });
      yield* Effect.logInfo("company_source.created");
      return created;
    }, withModuleLogs);

    const retrySource = Effect.fn("CompanyService.retrySource")(function* (
      input: CompanySourceRetryInput,
    ) {
      yield* Effect.annotateCurrentSpan({
        "company.id": input.companyId,
        "source.id": input.sourceId,
      });
      const company = yield* repo.get(input.companyId);
      if (!company) return yield* new ErrorCompanyNotFound({ id: input.companyId });

      const source = yield* repo.getSource(input.sourceId);
      if (!source || source.companyId !== input.companyId) {
        return yield* new ErrorCompanyNotFound({ id: input.companyId });
      }

      yield* repo.updateSourceStatus({ id: source.id, status: "pending", error: null });
      yield* sourceIngestQueue.enqueue({
        companyId: input.companyId,
        sourceId: source.id,
        reason: "source_retried",
      });
      yield* Effect.logInfo("company_source.retried");
      return { ...source, status: "pending" as const, error: null };
    }, withModuleLogs);

    const upsertSourceInsight = Effect.fn("CompanyService.upsertSourceInsight")(function* (
      input: CompanySourceInsight,
    ) {
      const insight = yield* repo.upsertSourceInsight(input);
      yield* companyCheck.enqueueRun(input.companyId, "source_insights_changed", input.id);
      return insight;
    }, withModuleLogs);

    const upsertSourceInsights = Effect.fn("CompanyService.upsertSourceInsights")(function* (
      companyId: string,
      sourceId: string,
      inputs: ReadonlyArray<CompanySourceInsight>,
    ) {
      for (const input of inputs) {
        yield* repo.upsertSourceInsight(input);
      }
      yield* companyCheck.enqueueRun(companyId, "source_insights_changed", sourceId);
      return inputs;
    }, withModuleLogs);

    const get = Effect.fn("CompanyService.get")(function* (id: string) {
      yield* Effect.annotateCurrentSpan({ "company.id": id });
      const company = yield* repo.get(id);
      if (!company) return yield* new ErrorCompanyNotFound({ id });
      return company;
    }, withModuleLogs);

    const list = Effect.fn("CompanyService.list")(function* () {
      return yield* repo.list();
    }, withModuleLogs);

    const getDetail = Effect.fn("CompanyService.getDetail")(function* (id: string) {
      yield* Effect.annotateCurrentSpan({ "company.id": id });
      const company = yield* get(id);
      const sources = yield* repo.listSources(id);
      const insights = yield* repo.listSourceInsights(id);
      const checkGroups = yield* companyCheck.getGroups(id);
      const history = getHistory({ companyId: id, sources, insights, checkGroups });
      return {
        company,
        checkGroups,
        sources,
        insights,
        history,
      } satisfies CompanyDetail;
    }, withModuleLogs);

    return {
      create,
      createSource,
      retrySource,
      upsert,
      update,
      delete: deleteCompany,
      upsertSource,
      upsertSourceInsight,
      upsertSourceInsights,
      get,
      getDetail,
      list,
    } as const;
  }),
}) {}

export const CompanyServiceLive = Layer.effect(CompanyService, CompanyService.make);

const storePdfSource = Effect.fn("storePdfSource")(function* (
  sourceId: string,
  contentBase64: string,
) {
  const fileName = `${toCompanyId({ name: sourceId })}.pdf`;
  const filePath = path.join(sourceUploadDir, fileName);
  yield* Effect.promise(() => mkdir(sourceUploadDir, { recursive: true }));
  yield* Effect.promise(() => Bun.write(filePath, Buffer.from(contentBase64, "base64")));
  return `/uploads/company-sources/${fileName}`;
});

function getHistory({
  companyId,
  sources,
  insights,
  checkGroups,
}: {
  readonly companyId: string;
  readonly sources: ReadonlyArray<CompanySource>;
  readonly insights: ReadonlyArray<CompanySourceInsight>;
  readonly checkGroups: CompanyDetail["checkGroups"];
}): ReadonlyArray<CompanyHistoryItem> {
  const checks = checkGroups.flatMap((group) => group.checks);
  return sources
    .flatMap((source) => {
      const sourceInsights = insights.filter((insight) => insight.sourceId === source.id);
      if (sourceInsights.length === 0 && source.status === "ready") return [];
      const sourceInsightIds = new Set(sourceInsights.map((insight) => insight.id));
      const affectedChecks = checks
        .filter((check) =>
          check.supportingInsightIds.some((insightId) => sourceInsightIds.has(insightId)),
        )
        .map(
          (check): CompanyHistoryAffectedCheck => ({
            id: check.id,
            checkDefinitionId: check.checkDefinitionId,
            groupLabel: check.groupLabel,
            label: check.label,
            status: check.status,
            detail: check.detail,
          }),
        );
      return [
        {
          id: `${source.id}:history`,
          companyId,
          sourceId: source.id,
          sourceTitle: source.title,
          sourceKind: source.kind,
          sourceStatus: source.status,
          insightCount: sourceInsights.length,
          insights: sourceInsights,
          affectedChecks,
          updatedAt: Math.max(
            source.updatedAt,
            ...sourceInsights.map((insight) => insight.updatedAt),
          ),
        },
      ];
    })
    .toSorted((left, right) => right.updatedAt - left.updatedAt);
}
