import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { Company } from "./company.schema";
import { ErrorCompanyNotFound } from "./company.service";

export class CompanyList extends Rpc.make("CompanyList", {
  success: Schema.Array(Company),
}) {}

export class CompanyGet extends Rpc.make("CompanyGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Company,
  error: ErrorCompanyNotFound,
}) {}

export const CompanyRpcs = RpcGroup.make(CompanyList, CompanyGet);
