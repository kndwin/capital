import { Schema } from "effect";
import { CompanySourceInsightKind } from "../company/company.schema";

export const CompanyAiExtractedInsight = Schema.Struct({
  kind: CompanySourceInsightKind,
  locator: Schema.NullOr(Schema.String),
  text: Schema.String,
  confidence: Schema.Number,
});
export type CompanyAiExtractedInsight = typeof CompanyAiExtractedInsight.Type;

export const CompanyAiSourceExtraction = Schema.Struct({
  summary: Schema.NullOr(Schema.String),
  insights: Schema.Array(CompanyAiExtractedInsight),
});
export type CompanyAiSourceExtraction = typeof CompanyAiSourceExtraction.Type;
