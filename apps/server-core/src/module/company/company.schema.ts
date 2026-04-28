import { Schema } from "effect";

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
