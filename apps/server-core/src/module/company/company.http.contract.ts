import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import { ErrorCompanyApplicationInviteInvalid } from "./company.error";
import { CompanyApplicationSubmitInput, CompanyApplicationSubmitResult } from "./company.schema";

export class CompanyHttpGroup extends HttpApiGroup.make("company").add(
  HttpApiEndpoint.post("submitApplication", "/company/apply", {
    payload: CompanyApplicationSubmitInput,
    success: CompanyApplicationSubmitResult,
    error: ErrorCompanyApplicationInviteInvalid,
  }),
) {}
