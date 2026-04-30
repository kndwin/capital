import { Schema } from "effect";

export class ErrorCompanyNotFound extends Schema.TaggedErrorClass<ErrorCompanyNotFound>()(
  "ErrorCompanyNotFound",
  { id: Schema.String },
) {}

export class ErrorCompanyApplicationInviteInvalid extends Schema.TaggedErrorClass<ErrorCompanyApplicationInviteInvalid>()(
  "ErrorCompanyApplicationInviteInvalid",
  { message: Schema.String },
) {}
