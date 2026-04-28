import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorCompanyNotFound } from "../company/company.error";
import { CompanyCheckOverride, CompanyCheckOverrideSetInput } from "./company-check.schema";

export class CompanyCheckOverrideSet extends Rpc.make("CompanyCheckOverrideSet", {
  payload: CompanyCheckOverrideSetInput,
  success: CompanyCheckOverride,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyCheckEngineRun extends Rpc.make("CompanyCheckEngineRun", {
  payload: Schema.Struct({
    companyId: Schema.String,
    reason: Schema.String,
    inputKey: Schema.String,
  }),
  success: Schema.String,
}) {}

export const CompanyCheckRpcs = RpcGroup.make(CompanyCheckOverrideSet, CompanyCheckEngineRun);
