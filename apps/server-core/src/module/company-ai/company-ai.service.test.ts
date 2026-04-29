import { describe, it, assert } from "@effect/vitest";
import { CompanyAiService } from "./company-ai.service";

describe("CompanyAiService", () => {
  it("exports the service tag", () => {
    assert.isDefined(CompanyAiService);
  });
});
