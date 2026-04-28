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

export const CompanyCreateInput = Schema.Struct({
  name: Schema.String,
});
export type CompanyCreateInput = typeof CompanyCreateInput.Type;

export const CompanySourceKind = Schema.Union([
  Schema.Literal("pdf"),
  Schema.Literal("xlsx"),
  Schema.Literal("url"),
  Schema.Literal("note"),
]);
export type CompanySourceKind = typeof CompanySourceKind.Type;

export const CompanySource = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  kind: CompanySourceKind,
  title: Schema.String,
  subtitle: Schema.NullOr(Schema.String),
  confidence: Schema.Number,
  selected: Schema.Boolean,
  order: Schema.Number,
  updatedAt: Schema.Number,
});
export type CompanySource = typeof CompanySource.Type;

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

export const CompanyDetail = Schema.Struct({
  company: Company,
  checkGroups: Schema.Array(CompanyCheckGroup),
  sources: Schema.Array(CompanySource),
  insights: Schema.Array(CompanySourceInsight),
});
export type CompanyDetail = typeof CompanyDetail.Type;
