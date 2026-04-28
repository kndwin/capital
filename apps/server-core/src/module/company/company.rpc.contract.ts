import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorCompanyNotFound } from "./company.error";
import { Company, CompanyCreateInput, CompanyDetail } from "./company.schema";

export class CompanyCreate extends Rpc.make("CompanyCreate", {
  payload: CompanyCreateInput,
  success: Company,
}) {}

export class CompanyList extends Rpc.make("CompanyList", {
  success: Schema.Array(Company),
}) {}

export class CompanyGet extends Rpc.make("CompanyGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Company,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyDetailGet extends Rpc.make("CompanyDetailGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: CompanyDetail,
  error: ErrorCompanyNotFound,
}) {}

export const CompanyRpcs = RpcGroup.make(CompanyCreate, CompanyList, CompanyGet, CompanyDetailGet);
