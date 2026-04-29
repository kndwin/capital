import { Context, Effect, Layer } from "effect";
import { AcmeMemoRenderInput } from "./memo.seed";
import type { MemoRenderInput, MemoRenderOutput } from "./memo.schema";
import { renderMemoHtml } from "./memo.render";

const withModuleLogs = Effect.annotateLogs({ module: "memo" });

export class MemoService extends Context.Service<MemoService>()("module/MemoService", {
  make: Effect.gen(function* () {
    yield* Effect.void;
    const renderPreview = Effect.fn("MemoService.renderPreview")(function* (
      input: MemoRenderInput,
    ) {
      yield* Effect.void;
      return { html: renderMemoHtml(input) } satisfies MemoRenderOutput;
    }, withModuleLogs);

    const renderSeedPreview = Effect.fn("MemoService.renderSeedPreview")(function* () {
      return yield* renderPreview(AcmeMemoRenderInput);
    }, withModuleLogs);

    return { renderPreview, renderSeedPreview } as const;
  }),
}) {}

export const MemoServiceLive = Layer.effect(MemoService, MemoService.make);
