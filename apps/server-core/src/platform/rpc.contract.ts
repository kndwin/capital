import { CompanyCheckRpcs } from "../module/company-check/company-check.rpc.contract";
import { CompanyRpcs } from "../module/company/company.rpc.contract";
import { HealthRpcs } from "../module/health/health.rpc.contract";
import { MemoRpcs } from "../module/memo/memo.rpc.contract";

export const ApiGroup = HealthRpcs.merge(CompanyRpcs).merge(CompanyCheckRpcs).merge(MemoRpcs);

export * from "../module/company-check/company-check.rpc.contract";
export * from "../module/company-check/company-check.schema";
export * from "../module/company/company.rpc.contract";
export * from "../module/company/company.schema";
export { ErrorCompanyNotFound } from "../module/company/company.error";
export * from "../module/health/health.rpc.contract";
export * from "../module/memo/memo.rpc.contract";
export * from "../module/memo/memo.schema";
export { ErrorRpcForbidden, ErrorRpcUnauthorized } from "./auth/rpc-auth.error";
