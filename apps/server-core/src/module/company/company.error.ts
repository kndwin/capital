import { Schema } from "effect";

export class ErrorCompanyNotFound extends Schema.TaggedErrorClass<ErrorCompanyNotFound>()(
  "ErrorCompanyNotFound",
  { id: Schema.String },
) {}
