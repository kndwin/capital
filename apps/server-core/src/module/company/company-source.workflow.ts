import { Clock, Effect, Layer, Schema } from "effect";
import { Workflow, WorkflowEngine } from "effect/unstable/workflow";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CompanyAiService,
  ErrorCompanyAi,
  ErrorCompanyAiInvalidResponse,
} from "../company-ai/company-ai.service";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanySourceIngestQueue } from "./company-source.queue";
import { CompanyRepo } from "./company.repo";
import type { CompanySourceAcquiredContent, CompanySourceInsight } from "./company.schema";

const sourceUploadDir = path.resolve(process.cwd(), ".capital/uploads/company-sources");

class ErrorCompanySourceIngest extends Schema.TaggedErrorClass<ErrorCompanySourceIngest>()(
  "ErrorCompanySourceIngest",
  { message: Schema.String },
) {}

export const CompanySourceIngestWorkflow = Workflow.make({
  name: "CompanySourceIngestWorkflow",
  payload: {
    companyId: Schema.String,
    sourceId: Schema.String,
    reason: Schema.Union([Schema.Literal("source_created"), Schema.Literal("source_retried")]),
  },
  success: Schema.String,
  error: Schema.Never,
  idempotencyKey: (payload) => `${payload.companyId}:${payload.sourceId}:${payload.reason}`,
});

export const CompanySourceIngestWorkflowLive = CompanySourceIngestWorkflow.toLayer((payload) =>
  Effect.gen(function* () {
    const repo = yield* CompanyRepo;
    const checks = yield* CompanyCheckService;
    const ai = yield* CompanyAiService;

    const ingest = Effect.gen(function* () {
      const company = yield* repo.get(payload.companyId);
      const source = yield* repo.getSource(payload.sourceId);
      if (!company || !source) return payload.sourceId;

      yield* repo.updateSourceStatus({ id: source.id, status: "acquiring", error: null });
      const storedContent: CompanySourceAcquiredContent | null =
        source.kind === "url" || source.kind === "pdf"
          ? null
          : yield* acquireStoredSourceText(source.id);
      const fileBase64 =
        source.kind === "pdf" ? yield* acquireStoredPdfBase64(source.fileUrl) : undefined;
      yield* repo.updateSourceStatus({ id: source.id, status: "extracting", error: null });

      const refreshedSource = (yield* repo.getSource(source.id)) ?? source;
      const extracted = yield* ai.extractSourceInsights({
        company,
        source: refreshedSource,
        ...(storedContent ? { text: storedContent.text } : {}),
        ...(fileBase64 ? { fileBase64 } : {}),
      });
      const acquiredContent = extracted.acquired ?? storedContent;
      if (!acquiredContent) {
        return yield* new ErrorCompanySourceIngest({ message: "Source has no acquired content" });
      }
      yield* repo.updateSourceAcquiredContent({ sourceId: source.id, content: acquiredContent });
      const extraction = extracted.extraction;
      const summary = extraction.summary?.trim();
      if (summary && !company.description) {
        yield* repo.upsert({ ...company, description: summary });
      }
      const now = yield* Clock.currentTimeMillis;
      const insights = extraction.insights.map(
        (insight, index): CompanySourceInsight => ({
          id: `${source.id}:insight:${index + 1}`,
          companyId: company.id,
          sourceId: source.id,
          kind: insight.kind,
          locator: insight.locator,
          text: insight.text,
          extractorVersion: "openai-gpt-5.5-v1",
          insightWorkflowRunId: `${source.id}:ingest`,
          order: (index + 1) * 10,
          updatedAt: now,
        }),
      );
      for (const insight of insights) {
        yield* repo.upsertSourceInsight(insight);
      }
      yield* checks.enqueueRun(company.id, "source_insights_changed", source.id);
      yield* repo.updateSourceStatus({ id: source.id, status: "ready", error: null });
      return source.id;
    });

    return yield* ingest.pipe(
      Effect.catch((error) =>
        repo
          .updateSourceStatus({
            id: payload.sourceId,
            status: "failed",
            error: sourceIngestErrorMessage(error),
          })
          .pipe(
            Effect.as(payload.sourceId),
            Effect.catch(() => Effect.succeed(payload.sourceId)),
          ),
      ),
    );
  }),
);

export const CompanySourceIngestQueueLive = Layer.effect(
  CompanySourceIngestQueue,
  Effect.gen(function* () {
    const workflowEngine = yield* WorkflowEngine.WorkflowEngine;
    return CompanySourceIngestQueue.of({
      enqueue: Effect.fn("CompanySourceIngestQueue.enqueue")(function* (input) {
        const executionId = yield* CompanySourceIngestWorkflow.executionId(input);
        return yield* workflowEngine.execute(CompanySourceIngestWorkflow, {
          executionId,
          payload: input,
          discard: true,
        });
      }),
    });
  }),
);

export const CompanySourceWorkflowLive = Layer.mergeAll(CompanySourceIngestWorkflowLive);

const acquireStoredSourceText = Effect.fn("acquireStoredSourceText")(function* (sourceId: string) {
  const repo = yield* CompanyRepo;
  const source = yield* repo.getSource(sourceId);
  const text = yield* repo.getSourceAcquiredText(sourceId);
  if (!source || !text) {
    return yield* new ErrorCompanySourceIngest({ message: "Source has no acquired text" });
  }
  const provider: CompanySourceAcquiredContent["provider"] =
    source.kind === "pdf" ? "pdf_parser" : source.kind === "xlsx" ? "xlsx_parser" : "user_note";
  return {
    provider,
    title: null,
    finalUrl: source.url,
    text,
    textCharCount: source.acquiredTextCharCount ?? text.length,
    textTruncated: source.acquiredTextTruncated,
    textHash: source.acquiredTextHash ?? "",
  };
});

const acquireStoredPdfBase64 = Effect.fn("acquireStoredPdfBase64")(function* (
  fileUrl: string | null,
) {
  if (!fileUrl) {
    return yield* new ErrorCompanySourceIngest({ message: "PDF source is missing file url" });
  }
  const fileName = path.basename(fileUrl);
  const filePath = path.join(sourceUploadDir, fileName);
  const bytes = yield* Effect.tryPromise({
    try: () => readFile(filePath),
    catch: () => new ErrorCompanySourceIngest({ message: "PDF source file could not be read" }),
  });
  return bytes.toString("base64");
});

function sourceIngestErrorMessage(error: unknown): string {
  if (error instanceof ErrorCompanyAi) {
    return `AI source extraction failed: ${formatErrorValue(error.reason)}`;
  }
  if (error instanceof ErrorCompanyAiInvalidResponse) {
    return error.message;
  }
  if (error instanceof ErrorCompanySourceIngest) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message.trim() || error.name || "Source ingestion failed";
  }
  return "Source ingestion failed";
}

function formatErrorValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "unknown reason";
  if (typeof value === "bigint" || typeof value === "symbol") return String(value);
  if (typeof value !== "object") return "unknown reason";

  const message = readStringField(value, "message");
  if (message) return message;

  const tag = readStringField(value, "_tag");
  const status = readStringField(value, "status") ?? readStringField(value, "statusCode");
  const reason = readStringField(value, "reason") ?? readStringField(value, "cause");
  return [tag, status, reason].filter(Boolean).join(": ") || "unknown reason";
}

function readStringField(value: object, key: string): string | undefined {
  if (!(key in value)) return undefined;
  const field = (value as Record<string, unknown>)[key];
  if (typeof field === "string") return field.trim() || undefined;
  if (typeof field === "number" || typeof field === "boolean") return String(field);
  return undefined;
}
