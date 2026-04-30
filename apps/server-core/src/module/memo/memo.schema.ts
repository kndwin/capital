import { Schema } from "effect";

export const MemoRenderVerdict = Schema.Union([
  Schema.Literal("pass"),
  Schema.Literal("concern"),
  Schema.Literal("fail"),
  Schema.Literal("unknown"),
]);
export type MemoRenderVerdict = typeof MemoRenderVerdict.Type;

export const MemoRenderRecommendation = Schema.Union([
  Schema.Literal("lean_in"),
  Schema.Literal("watch"),
  Schema.Literal("pass"),
  Schema.Literal("needs_work"),
]);
export type MemoRenderRecommendation = typeof MemoRenderRecommendation.Type;

export const MemoRenderCitation = Schema.Struct({
  sourceId: Schema.String,
  label: Schema.String,
  locator: Schema.NullOr(Schema.String),
});
export type MemoRenderCitation = typeof MemoRenderCitation.Type;

export const MemoRenderCompany = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  stage: Schema.String,
  sector: Schema.NullOr(Schema.String),
  location: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  score: Schema.NullOr(Schema.Number),
  recommendation: MemoRenderRecommendation,
});
export type MemoRenderCompany = typeof MemoRenderCompany.Type;

export const MemoRenderSummary = Schema.Struct({
  headline: Schema.String,
  thesis: Schema.String,
  keyTakeaways: Schema.Array(Schema.String),
  upside: Schema.Array(Schema.String),
  risks: Schema.Array(Schema.String),
  executiveSummary: Schema.NullOr(Schema.String),
});
export type MemoRenderSummary = typeof MemoRenderSummary.Type;

export const MemoNarrative = Schema.Struct({
  headline: Schema.String,
  thesis: Schema.String,
  executiveSummary: Schema.String,
  keyTakeaways: Schema.Array(Schema.String),
  upside: Schema.Array(Schema.String),
  risks: Schema.Array(Schema.String),
});
export type MemoNarrative = typeof MemoNarrative.Type;

export const MemoMaxPages = Schema.Union([Schema.Literal(1), Schema.Literal(2), Schema.Literal(3)]);
export type MemoMaxPages = typeof MemoMaxPages.Type;

export const MemoNarrativeConfig = Schema.Struct({
  maxPages: MemoMaxPages,
});
export type MemoNarrativeConfig = typeof MemoNarrativeConfig.Type;

export const MemoRecord = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  narrative: MemoNarrative,
  config: MemoNarrativeConfig,
  createdAt: Schema.Number,
});
export type MemoRecord = typeof MemoRecord.Type;

export const MemoListByCompanyInput = Schema.Struct({
  companyId: Schema.String,
});
export type MemoListByCompanyInput = typeof MemoListByCompanyInput.Type;

export const MemoRenderCheck = Schema.Struct({
  id: Schema.String,
  groupId: Schema.String,
  label: Schema.String,
  status: MemoRenderVerdict,
  score: Schema.Number,
  detail: Schema.NullOr(Schema.String),
  rationale: Schema.String,
  citations: Schema.Array(MemoRenderCitation),
});
export type MemoRenderCheck = typeof MemoRenderCheck.Type;

export const MemoRenderCheckGroupVerdict = Schema.Union([
  Schema.Literal("strong"),
  Schema.Literal("mixed"),
  Schema.Literal("weak"),
  Schema.Literal("unknown"),
]);
export type MemoRenderCheckGroupVerdict = typeof MemoRenderCheckGroupVerdict.Type;

export const MemoRenderCheckGroup = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  verdict: MemoRenderCheckGroupVerdict,
  score: Schema.NullOr(Schema.Number),
  summary: Schema.String,
  checks: Schema.Array(MemoRenderCheck),
});
export type MemoRenderCheckGroup = typeof MemoRenderCheckGroup.Type;

export const MemoRenderSourceKind = Schema.Union([
  Schema.Literal("pdf"),
  Schema.Literal("xlsx"),
  Schema.Literal("url"),
  Schema.Literal("note"),
  Schema.Literal("chat"),
]);
export type MemoRenderSourceKind = typeof MemoRenderSourceKind.Type;

export const MemoRenderSource = Schema.Struct({
  id: Schema.String,
  kind: MemoRenderSourceKind,
  title: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  confidence: Schema.Number,
});
export type MemoRenderSource = typeof MemoRenderSource.Type;

export const MemoRenderInsightKind = Schema.Union([
  Schema.Literal("excerpt"),
  Schema.Literal("metric"),
  Schema.Literal("claim"),
  Schema.Literal("note"),
]);
export type MemoRenderInsightKind = typeof MemoRenderInsightKind.Type;

export const MemoRenderInsight = Schema.Struct({
  id: Schema.String,
  sourceId: Schema.String,
  kind: MemoRenderInsightKind,
  locator: Schema.NullOr(Schema.String),
  text: Schema.String,
  linkedCheckIds: Schema.Array(Schema.String),
});
export type MemoRenderInsight = typeof MemoRenderInsight.Type;

export const MemoRenderInput = Schema.Struct({
  generatedAt: Schema.Number,
  company: MemoRenderCompany,
  summary: MemoRenderSummary,
  checkGroups: Schema.Array(MemoRenderCheckGroup),
  sources: Schema.Array(MemoRenderSource),
  insights: Schema.Array(MemoRenderInsight),
  maxPages: Schema.NullOr(Schema.Number),
});
export type MemoRenderInput = typeof MemoRenderInput.Type;

export const MemoNarrativeGenerateInput = Schema.Struct({
  input: MemoRenderInput,
  config: MemoNarrativeConfig,
});
export type MemoNarrativeGenerateInput = typeof MemoNarrativeGenerateInput.Type;

export const MemoRenderOutput = Schema.Struct({
  html: Schema.String,
});
export type MemoRenderOutput = typeof MemoRenderOutput.Type;
