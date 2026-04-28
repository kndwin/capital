import { Schema } from "effect";

export const CompanyCheckStatus = Schema.Union([
  Schema.Literal("pass"),
  Schema.Literal("concern"),
  Schema.Literal("fail"),
  Schema.Literal("unknown"),
]);
export type CompanyCheckStatus = typeof CompanyCheckStatus.Type;

export const CompanyCheck = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  checkDefinitionId: Schema.String,
  groupId: Schema.String,
  groupLabel: Schema.String,
  label: Schema.String,
  status: CompanyCheckStatus,
  score: Schema.Number,
  detail: Schema.NullOr(Schema.String),
  rationale: Schema.String,
  source: Schema.Union([
    Schema.Literal("engine"),
    Schema.Literal("override"),
    Schema.Literal("seed"),
  ]),
  overrideId: Schema.NullOr(Schema.String),
  supportingInsightIds: Schema.Array(Schema.String),
  order: Schema.Number,
  updatedAt: Schema.Number,
});
export type CompanyCheck = typeof CompanyCheck.Type;

export const CompanyCheckRunStatus = Schema.Union([
  Schema.Literal("running"),
  Schema.Literal("completed"),
  Schema.Literal("failed"),
]);
export type CompanyCheckRunStatus = typeof CompanyCheckRunStatus.Type;

export const CompanyCheckRun = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  status: CompanyCheckRunStatus,
  engineVersion: Schema.String,
  inputHash: Schema.String,
  reason: Schema.String,
  error: Schema.NullOr(Schema.String),
  updatedAt: Schema.Number,
});
export type CompanyCheckRun = typeof CompanyCheckRun.Type;

export const CompanyEngineCheck = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  checkDefinitionId: Schema.String,
  groupId: Schema.String,
  groupLabel: Schema.String,
  label: Schema.String,
  status: CompanyCheckStatus,
  score: Schema.Number,
  detail: Schema.NullOr(Schema.String),
  rationale: Schema.String,
  runId: Schema.String,
  engineVersion: Schema.String,
  inputHash: Schema.String,
  order: Schema.Number,
  updatedAt: Schema.Number,
});
export type CompanyEngineCheck = typeof CompanyEngineCheck.Type;

export const CompanyCheckOverride = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  checkDefinitionId: Schema.String,
  status: CompanyCheckStatus,
  score: Schema.Number,
  detail: Schema.NullOr(Schema.String),
  rationale: Schema.String,
  createdByUserId: Schema.String,
  updatedAt: Schema.Number,
});
export type CompanyCheckOverride = typeof CompanyCheckOverride.Type;

export const CompanyCheckOverrideSetInput = Schema.Struct({
  companyId: Schema.String,
  checkDefinitionId: Schema.String,
  status: CompanyCheckStatus,
  score: Schema.Number,
  detail: Schema.NullOr(Schema.String),
  rationale: Schema.String,
  createdByUserId: Schema.String,
});
export type CompanyCheckOverrideSetInput = typeof CompanyCheckOverrideSetInput.Type;

export const CompanyCheckInsightRelationship = Schema.Union([
  Schema.Literal("supports"),
  Schema.Literal("conflicts"),
  Schema.Literal("mentions"),
]);
export type CompanyCheckInsightRelationship = typeof CompanyCheckInsightRelationship.Type;

export const CompanyCheckInsight = Schema.Struct({
  id: Schema.String,
  companyId: Schema.String,
  checkDefinitionId: Schema.String,
  insightId: Schema.String,
  runId: Schema.String,
  relationship: CompanyCheckInsightRelationship,
  updatedAt: Schema.Number,
});
export type CompanyCheckInsight = typeof CompanyCheckInsight.Type;

export const CompanyCheckGroupVerdict = Schema.Union([
  Schema.Literal("strong"),
  Schema.Literal("mixed"),
  Schema.Literal("weak"),
  Schema.Literal("unknown"),
]);
export type CompanyCheckGroupVerdict = typeof CompanyCheckGroupVerdict.Type;

export const CompanyCheckGroup = Schema.Struct({
  id: Schema.String,
  label: Schema.String,
  verdict: CompanyCheckGroupVerdict,
  score: Schema.NullOr(Schema.Number),
  checks: Schema.Array(CompanyCheck),
});
export type CompanyCheckGroup = typeof CompanyCheckGroup.Type;

export type CompanyCheckDefinition = {
  readonly id: string;
  readonly groupId: string;
  readonly groupLabel: string;
  readonly label: string;
  readonly weight: number;
  readonly order: number;
};

export type CompanyCheckJudgement = {
  readonly status: CompanyCheck["status"];
  readonly score: number;
  readonly detail: string | null;
  readonly rationale: string;
  readonly insightIds: ReadonlyArray<string>;
};
