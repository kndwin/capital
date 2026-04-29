import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { AcmeMemoRenderInput } from "./memo.seed";
import { MemoService, MemoServiceLive } from "./memo.service";

describe("MemoService", () => {
  it.effect("renders the seed preview as standalone HTML", () =>
    Effect.gen(function* () {
      const service = yield* MemoService;
      const output = yield* service.renderSeedPreview();

      assert.isTrue(output.html.startsWith("<!doctype html>"));
      assert.include(output.html, "Acme Robotics");
      assert.include(output.html, "Executive Summary");
      assert.include(output.html, "Check Findings");
      assert.include(output.html, "Evidence");
      assert.include(output.html, "Source Register");
      assert.notInclude(output.html, "{{");
    }).pipe(Effect.provide(MemoServiceLive)),
  );

  it.effect("escapes input text", () =>
    Effect.gen(function* () {
      const service = yield* MemoService;
      const output = yield* service.renderPreview({
        ...AcmeMemoRenderInput,
        company: { ...AcmeMemoRenderInput.company, name: "<script>alert('x')</script>" },
      });

      assert.include(output.html, "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
      assert.notInclude(output.html, "<script>alert('x')</script>");
    }).pipe(Effect.provide(MemoServiceLive)),
  );
});
