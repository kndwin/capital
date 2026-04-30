import { Clock, Context, Effect, Layer } from "effect";
import { createHash, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { CompanyCheckService } from "../company-check/company-check.service";
import { CompanySourceIngestQueue } from "./company-source.queue";
import { ErrorCompanyApplicationInviteInvalid, ErrorCompanyNotFound } from "./company.error";
import { CompanyRepo } from "./company.repo";
import type {
  Company,
  CompanyApplicationInviteCreateInput,
  CompanyApplicationSubmitInput,
  CompanyWatchTargetCreateInput,
  CompanySourceCreateInput,
  CompanySourceRetryInput,
  CompanyDetail,
  CompanyCreateInput,
  CompanyHistoryAffectedCheck,
  CompanyHistoryItem,
  CompanySource,
  CompanySourceInsight,
  CompanyWatchTarget,
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

    const createRecord = Effect.fn("CompanyService.createRecord")(function* (input: {
      readonly name: string;
      readonly description: string | null;
      readonly website: string | null;
    }) {
      const now = yield* Clock.currentTimeMillis;
      const name = input.name.trim() || "Stealth company";
      const company: Company = {
        id: `${toCompanyId({ name })}-${now}`,
        name,
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
      yield* Effect.logInfo("company.created");
      return created;
    }, withModuleLogs);

    const create = Effect.fn("CompanyService.create")(function* (input: CompanyCreateInput) {
      const url = input.url.trim();
      const created = yield* createRecord({
        name: input.name,
        description: null,
        website: url,
      });
      yield* createInitialSourcingSources(created);
      return created;
    }, withModuleLogs);

    const submitApplication = Effect.fn("CompanyService.submitApplication")(function* (
      input: CompanyApplicationSubmitInput,
    ) {
      const token = input.token.trim();
      if (!token) {
        return yield* new ErrorCompanyApplicationInviteInvalid({
          message: "Invite token is required",
        });
      }

      const invite = yield* repo.getApplicationInviteByTokenHash(hashApplicationInviteToken(token));
      const now = yield* Clock.currentTimeMillis;
      if (!invite || invite.status !== "open" || invite.expiresAt <= now) {
        return yield* new ErrorCompanyApplicationInviteInvalid({
          message: "Invite link is invalid, expired, or already used",
        });
      }

      const company = yield* createRecord({
        name: input.name.trim(),
        website: input.website?.trim() || null,
        description: input.description?.trim() || null,
      });

      yield* createInitialSourcingSources(company).pipe(
        Effect.catchTags({ ErrorCompanyNotFound: Effect.die }),
      );

      yield* createSource({
        companyId: company.id,
        kind: "note",
        title: "Founder application",
        text: buildApplicationNote(input),
      }).pipe(Effect.catchTags({ ErrorCompanyNotFound: Effect.die }));

      for (const link of input.links) {
        const url = link.url.trim();
        if (!url) continue;
        yield* createSource({
          companyId: company.id,
          kind: "url",
          url,
          title: link.title?.trim() || null,
        }).pipe(Effect.catchTags({ ErrorCompanyNotFound: Effect.die }));
      }

      for (const file of input.files) {
        if (!file.fileName.trim() || !file.contentBase64.trim()) continue;
        yield* createSource({
          companyId: company.id,
          kind: "pdf",
          fileName: file.fileName.trim(),
          contentBase64: file.contentBase64,
          title: file.fileName.trim(),
        }).pipe(Effect.catchTags({ ErrorCompanyNotFound: Effect.die }));
      }

      yield* repo.markApplicationInviteUsed({ id: invite.id, companyId: company.id });
      yield* Effect.logInfo("company_application.submitted");
      return { companyId: company.id };
    }, withModuleLogs);

    const createApplicationInvite = Effect.fn("CompanyService.createApplicationInvite")(function* (
      input: CompanyApplicationInviteCreateInput,
    ) {
      const now = yield* Clock.currentTimeMillis;
      const expiresInDays = Math.max(1, Math.min(90, Math.floor(input.expiresInDays)));
      const expiresAt = now + expiresInDays * 86_400_000;
      const token = randomBytes(24).toString("base64url");
      const inviteId = `application-invite-${now}`;
      yield* repo.createApplicationInvite({
        id: inviteId,
        tokenHash: hashApplicationInviteToken(token),
        expiresAt,
      });
      yield* Effect.logInfo("company_application_invite.created");
      return {
        inviteId,
        token,
        url: `/apply?token=${encodeURIComponent(token)}`,
        expiresAt,
      };
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

    const createInitialSourcingSources = Effect.fn("CompanyService.createInitialSourcingSources")(
      function* (company: Company) {
        if (company.website?.trim()) {
          yield* createSource({
            companyId: company.id,
            kind: "url",
            url: company.website.trim(),
            title: "Company website",
          });
        }
        yield* createSource({
          companyId: company.id,
          kind: "chat",
          title: "Market research",
          prompt: buildInitialMarketResearchPrompt(company),
        });
        yield* createSource({
          companyId: company.id,
          kind: "chat",
          title: "Founder research",
          prompt: buildInitialFounderResearchPrompt(company),
        });
      },
      withModuleLogs,
    );

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

    const createWatchTarget = Effect.fn("CompanyService.createWatchTarget")(function* (
      input: CompanyWatchTargetCreateInput,
    ) {
      yield* Effect.annotateCurrentSpan({ "company.id": input.companyId });
      const company = yield* repo.get(input.companyId);
      if (!company) return yield* new ErrorCompanyNotFound({ id: input.companyId });

      const now = yield* Clock.currentTimeMillis;
      const title = input.title?.trim() || null;
      const locator = normalizeWatchTargetLocator(input.kind, input.locator);
      const target: CompanyWatchTarget = {
        id: `${input.companyId}:watch:${input.kind}:${toCompanyId({ name: locator })}:${now}`,
        companyId: input.companyId,
        kind: input.kind,
        locator,
        url: input.kind === "web_page" ? locator : toXProfileUrl(locator),
        title,
        status: "active",
        lastScannedAt: null,
        lastMatchedAt: null,
        error: null,
        updatedAt: now,
      };
      const created = yield* repo.createWatchTarget(target);
      yield* Effect.logInfo("company_watch_target.created");
      return created;
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
      const watchTargetRows = yield* repo.listWatchTargets(id);
      const watchTargets = watchTargetRows.map((target) => ({
        target,
        recentScans: [],
        recentSources: [],
      }));
      const insights = yield* repo.listSourceInsights(id);
      const checkGroups = yield* companyCheck.getGroups(id);
      const history = getHistory({ companyId: id, sources, insights, checkGroups });
      return {
        company,
        checkGroups,
        sources,
        watchTargets,
        insights,
        history,
      } satisfies CompanyDetail;
    }, withModuleLogs);

    return {
      create,
      submitApplication,
      createApplicationInvite,
      createSource,
      createWatchTarget,
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

function hashApplicationInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeWatchTargetLocator(kind: CompanyWatchTarget["kind"], locator: string): string {
  const trimmed = locator.trim();
  if (kind === "x_profile") {
    return trimmed
      .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
      .replace(/^@/, "")
      .split(/[/?#]/)[0]!
      .trim();
  }
  return trimmed;
}

function toXProfileUrl(handle: string): string | null {
  return handle ? `https://x.com/${handle}` : null;
}

function buildApplicationNote(input: CompanyApplicationSubmitInput): string {
  return [
    `Company: ${input.name.trim()}`,
    input.website?.trim() ? `Website: ${input.website.trim()}` : null,
    input.description?.trim() ? `Description: ${input.description.trim()}` : null,
    `Product: ${input.product.trim()}`,
    `Customer: ${input.customer.trim()}`,
    `Traction: ${input.traction.trim()}`,
    input.fundraise?.trim() ? `Fundraise: ${input.fundraise.trim()}` : null,
    input.notes?.trim() ? `Additional notes: ${input.notes.trim()}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildInitialMarketResearchPrompt(company: Company): string {
  return [
    `Research ${company.name} for venture market diligence.`,
    company.website ? `Start with website: ${company.website}` : null,
    "Act as a market research subagent reporting sources to a research coordinator.",
    "Find public evidence about market category, ICP, competitors, pricing, traction signals, customer adoption, and market risks.",
    "Use only facts supported by public sources and include source URLs or names in locators.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

function buildInitialFounderResearchPrompt(company: Company): string {
  return [
    `Research the founders and leadership behind ${company.name} for venture diligence.`,
    company.website ? `Start with website: ${company.website}` : null,
    "Act as a founder research subagent reporting sources to a research coordinator.",
    "Find public evidence about founder names, prior roles, education, prior startups, exits, domain expertise, hiring/team signals, and reputational risks.",
    "Use only facts supported by public sources and include source URLs or names in locators.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}
