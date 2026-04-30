import { Schema } from "effect";
import { CompanyCheckGroup } from "../company-check/company-check.schema";

export const CompanyStage = Schema.Union([
  Schema.Literal("pre_seed"),
  Schema.Literal("seed"),
  Schema.Literal("series_a"),
  Schema.Literal("series_b"),
  Schema.Literal("growth"),
  Schema.Literal("unknown"),
]);
export type CompanyStage = typeof CompanyStage.Type;

export const CompanyRiskLevel = Schema.Union([
  Schema.Literal("low"),
  Schema.Literal("medium"),
  Schema.Literal("high"),
  Schema.Literal("unknown"),
]);
export type CompanyRiskLevel = typeof CompanyRiskLevel.Type;

export const Company = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  stage: CompanyStage,
  sector: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Number),
  riskLevel: CompanyRiskLevel,
  updatedAt: Schema.Number,
});
export type Company = typeof Company.Type;

export const CompanySourceStatus = Schema.Union([
  Schema.Literal("pending"),
  Schema.Literal("acquiring"),
  Schema.Literal("extracting"),
  Schema.Literal("ready"),
  Schema.Literal("failed"),
]);
export type CompanySourceStatus = typeof CompanySourceStatus.Type;

export const CompanySourceKind = Schema.Union([
  Schema.Literal("pdf"),
  Schema.Literal("xlsx"),
  Schema.Literal("url"),
  Schema.Literal("note"),
  Schema.Literal("chat"),
]);
export type CompanySourceKind = typeof CompanySourceKind.Type;

export const CompanySource = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  kind: CompanySourceKind,
  status: CompanySourceStatus,
  title: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  confidence: Schema.Number,
  selected: Schema.Boolean,
  order: Schema.Number,
  url: Schema.NullOr(Schema.String),
  fileName: Schema.NullOr(Schema.String),
  fileUrl: Schema.NullOr(Schema.String),
  acquiredProvider: Schema.NullOr(Schema.String),
  acquiredText: Schema.NullOr(Schema.String),
  acquiredTextTruncated: Schema.Boolean,
  acquiredTextCharCount: Schema.NullOr(Schema.Number),
  acquiredTextHash: Schema.NullOr(Schema.String),
  error: Schema.NullOr(Schema.String),
  updatedAt: Schema.Number,
});
export type CompanySource = typeof CompanySource.Type;

export const CompanyWatchTargetStatus = Schema.Union([
  Schema.Literal("active"),
  Schema.Literal("paused"),
  Schema.Literal("failed"),
]);
export type CompanyWatchTargetStatus = typeof CompanyWatchTargetStatus.Type;

export const CompanyWatchTargetKind = Schema.Union([
  Schema.Literal("web_page"),
  Schema.Literal("x_profile"),
]);
export type CompanyWatchTargetKind = typeof CompanyWatchTargetKind.Type;

export const CompanyWatchTarget = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  kind: CompanyWatchTargetKind,
  locator: Schema.String,
  url: Schema.NullOr(Schema.String),
  title: Schema.NullOr(Schema.String),
  status: CompanyWatchTargetStatus,
  lastScannedAt: Schema.NullOr(Schema.Number),
  lastMatchedAt: Schema.NullOr(Schema.Number),
  error: Schema.NullOr(Schema.String),
  updatedAt: Schema.Number,
});
export type CompanyWatchTarget = typeof CompanyWatchTarget.Type;

export const CompanyWatchTargetScanStatus = Schema.Union([
  Schema.Literal("completed"),
  Schema.Literal("failed"),
  Schema.Literal("unsupported"),
  Schema.Literal("skipped"),
]);
export type CompanyWatchTargetScanStatus = typeof CompanyWatchTargetScanStatus.Type;

export const CompanyWatchTargetScan = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  watchTargetId: Schema.String,
  status: CompanyWatchTargetScanStatus,
  candidateCount: Schema.Number,
  createdSourceCount: Schema.Number,
  error: Schema.NullOr(Schema.String),
  scannedAt: Schema.Number,
});
export type CompanyWatchTargetScan = typeof CompanyWatchTargetScan.Type;

export const CompanyWatchTargetDetail = Schema.Struct({
  target: CompanyWatchTarget,
  recentScans: Schema.Array(CompanyWatchTargetScan),
  recentSources: Schema.Array(CompanySource),
});
export type CompanyWatchTargetDetail = typeof CompanyWatchTargetDetail.Type;

export const CompanyWatchTargetCreateInput = Schema.Struct({
  companyId: Schema.String,
  kind: CompanyWatchTargetKind,
  locator: Schema.String,
  title: Schema.NullOr(Schema.String),
});
export type CompanyWatchTargetCreateInput = typeof CompanyWatchTargetCreateInput.Type;

export const CompanySourceCreateInput = Schema.Union([
  Schema.Struct({
    companyId: Schema.String,
    kind: Schema.Literal("url"),
    url: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    companyId: Schema.String,
    kind: Schema.Literal("note"),
    text: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    companyId: Schema.String,
    kind: Schema.Literal("chat"),
    prompt: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    companyId: Schema.String,
    kind: Schema.Literal("pdf"),
    fileName: Schema.String,
    contentBase64: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
]);
export type CompanySourceCreateInput = typeof CompanySourceCreateInput.Type;

export const CompanySourceRetryInput = Schema.Struct({
  companyId: Schema.String,
  sourceId: Schema.String,
});
export type CompanySourceRetryInput = typeof CompanySourceRetryInput.Type;

export const CompanyInitialSourceInput = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("url"),
    url: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    kind: Schema.Literal("note"),
    text: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    kind: Schema.Literal("chat"),
    prompt: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
  Schema.Struct({
    kind: Schema.Literal("pdf"),
    fileName: Schema.String,
    contentBase64: Schema.String,
    title: Schema.NullOr(Schema.String),
  }),
]);
export type CompanyInitialSourceInput = typeof CompanyInitialSourceInput.Type;

export const CompanyCreateInput = Schema.Struct({
  name: Schema.String,
  url: Schema.String,
});
export type CompanyCreateInput = typeof CompanyCreateInput.Type;

export const CompanyApplicationLinkInput = Schema.Struct({
  title: Schema.NullOr(Schema.String),
  url: Schema.String,
});
export type CompanyApplicationLinkInput = typeof CompanyApplicationLinkInput.Type;

export const CompanyApplicationFileInput = Schema.Struct({
  fileName: Schema.String,
  contentBase64: Schema.String,
});
export type CompanyApplicationFileInput = typeof CompanyApplicationFileInput.Type;

export const CompanyApplicationSubmitInput = Schema.Struct({
  token: Schema.String,
  name: Schema.String,
  website: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  product: Schema.String,
  customer: Schema.String,
  traction: Schema.String,
  fundraise: Schema.NullOr(Schema.String),
  notes: Schema.NullOr(Schema.String),
  links: Schema.Array(CompanyApplicationLinkInput),
  files: Schema.Array(CompanyApplicationFileInput),
});
export type CompanyApplicationSubmitInput = typeof CompanyApplicationSubmitInput.Type;

export const CompanyApplicationSubmitResult = Schema.Struct({
  companyId: Schema.String,
});
export type CompanyApplicationSubmitResult = typeof CompanyApplicationSubmitResult.Type;

export const CompanyApplicationInviteCreateInput = Schema.Struct({
  expiresInDays: Schema.Number,
});
export type CompanyApplicationInviteCreateInput = typeof CompanyApplicationInviteCreateInput.Type;

export const CompanyApplicationInviteCreateResult = Schema.Struct({
  inviteId: Schema.String,
  token: Schema.String,
  url: Schema.String,
  expiresAt: Schema.Number,
});
export type CompanyApplicationInviteCreateResult = typeof CompanyApplicationInviteCreateResult.Type;

export const CompanyUpdateInput = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  stage: CompanyStage,
  sector: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  riskLevel: CompanyRiskLevel,
});
export type CompanyUpdateInput = typeof CompanyUpdateInput.Type;

export const CompanySourceAcquiredContent = Schema.Struct({
  provider: Schema.Union([
    Schema.Literal("openai_web_search"),
    Schema.Literal("url_fetch"),
    Schema.Literal("openai_file"),
    Schema.Literal("user_note"),
    Schema.Literal("pdf_parser"),
    Schema.Literal("xlsx_parser"),
  ]),
  title: Schema.NullOr(Schema.String),
  finalUrl: Schema.NullOr(Schema.String),
  text: Schema.String,
  textCharCount: Schema.Number,
  textTruncated: Schema.Boolean,
  textHash: Schema.String,
});
export type CompanySourceAcquiredContent = typeof CompanySourceAcquiredContent.Type;

export const CompanySourceInsightKind = Schema.Union([
  Schema.Literal("excerpt"),
  Schema.Literal("metric"),
  Schema.Literal("claim"),
  Schema.Literal("note"),
]);
export type CompanySourceInsightKind = typeof CompanySourceInsightKind.Type;

export const CompanySourceInsight = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  sourceId: Schema.String,
  kind: CompanySourceInsightKind,
  locator: Schema.NullOr(Schema.String),
  text: Schema.String,
  extractorVersion: Schema.String,
  insightWorkflowRunId: Schema.String,
  order: Schema.Number,
  updatedAt: Schema.Number,
});
export type CompanySourceInsight = typeof CompanySourceInsight.Type;

export const CompanyHistoryAffectedCheck = Schema.Struct({
  id: Schema.String,
  checkDefinitionId: Schema.String,
  groupLabel: Schema.String,
  label: Schema.String,
  status: Schema.Union([
    Schema.Literal("pass"),
    Schema.Literal("concern"),
    Schema.Literal("fail"),
    Schema.Literal("unknown"),
  ]),
  detail: Schema.NullOr(Schema.String),
});
export type CompanyHistoryAffectedCheck = typeof CompanyHistoryAffectedCheck.Type;

export const CompanyHistoryItem = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  sourceId: Schema.String,
  sourceTitle: Schema.String,
  sourceKind: CompanySourceKind,
  sourceStatus: CompanySourceStatus,
  insightCount: Schema.Number,
  insights: Schema.Array(CompanySourceInsight),
  affectedChecks: Schema.Array(CompanyHistoryAffectedCheck),
  updatedAt: Schema.Number,
});
export type CompanyHistoryItem = typeof CompanyHistoryItem.Type;

export const CompanyDetail = Schema.Struct({
  company: Company,
  checkGroups: Schema.Array(CompanyCheckGroup),
  sources: Schema.Array(CompanySource),
  watchTargets: Schema.Array(CompanyWatchTargetDetail),
  insights: Schema.Array(CompanySourceInsight),
  history: Schema.Array(CompanyHistoryItem),
});
export type CompanyDetail = typeof CompanyDetail.Type;
