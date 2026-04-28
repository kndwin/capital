import { CompanyRpcs } from "../module/company/company.rpc.contract";
import { HealthRpcs } from "../module/health/health.rpc.contract";

export const ApiGroup = HealthRpcs.merge(CompanyRpcs);

export * from "../module/company/company.rpc.contract";
export * from "../module/company/company.schema";
export { ErrorCompanyNotFound } from "../module/company/company.service";
export * from "../module/health/health.rpc.contract";
export { ErrorRpcForbidden, ErrorRpcUnauthorized } from "./auth/rpc-auth.error";
