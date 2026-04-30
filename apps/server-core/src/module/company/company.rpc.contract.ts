import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorCompanyNotFound } from "./company.error";
import {
  Company,
  CompanyApplicationInviteCreateInput,
  CompanyApplicationInviteCreateResult,
  CompanyCreateInput,
  CompanyDetail,
  CompanySource,
  CompanySourceCreateInput,
  CompanySourceRetryInput,
  CompanyUpdateInput,
  CompanyWatchTarget,
  CompanyWatchTargetCreateInput,
} from "./company.schema";

export class CompanyCreate extends Rpc.make("CompanyCreate", {
  payload: CompanyCreateInput,
  success: Company,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyList extends Rpc.make("CompanyList", {
  success: Schema.Array(Company),
}) {}

export class CompanyGet extends Rpc.make("CompanyGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Company,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyUpdate extends Rpc.make("CompanyUpdate", {
  payload: CompanyUpdateInput,
  success: Company,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyDelete extends Rpc.make("CompanyDelete", {
  payload: Schema.Struct({ id: Schema.String }),
  success: Schema.Void,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyDetailGet extends Rpc.make("CompanyDetailGet", {
  payload: Schema.Struct({ id: Schema.String }),
  success: CompanyDetail,
  error: ErrorCompanyNotFound,
}) {}

export class CompanySourceCreate extends Rpc.make("CompanySourceCreate", {
  payload: CompanySourceCreateInput,
  success: CompanySource,
  error: ErrorCompanyNotFound,
}) {}

export class CompanySourceRetry extends Rpc.make("CompanySourceRetry", {
  payload: CompanySourceRetryInput,
  success: CompanySource,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyWatchTargetCreate extends Rpc.make("CompanyWatchTargetCreate", {
  payload: CompanyWatchTargetCreateInput,
  success: CompanyWatchTarget,
  error: ErrorCompanyNotFound,
}) {}

export class CompanyApplicationInviteCreate extends Rpc.make("CompanyApplicationInviteCreate", {
  payload: CompanyApplicationInviteCreateInput,
  success: CompanyApplicationInviteCreateResult,
}) {}

export const CompanyRpcs = RpcGroup.make(
  CompanyCreate,
  CompanyList,
  CompanyGet,
  CompanyUpdate,
  CompanyDelete,
  CompanyDetailGet,
  CompanySourceCreate,
  CompanySourceRetry,
  CompanyWatchTargetCreate,
  CompanyApplicationInviteCreate,
);
