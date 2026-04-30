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

export const CompanyAiMarketWatchCandidate = Schema.Struct({
  title: Schema.String,
  url: Schema.String,
  summary: Schema.String,
  eventDate: Schema.NullOr(Schema.String),
  relevanceReason: Schema.String,
  confidence: Schema.Number,
});
export type CompanyAiMarketWatchCandidate = typeof CompanyAiMarketWatchCandidate.Type;

export const CompanyAiMarketWatchResult = Schema.Struct({
  candidates: Schema.Array(CompanyAiMarketWatchCandidate),
});
export type CompanyAiMarketWatchResult = typeof CompanyAiMarketWatchResult.Type;
