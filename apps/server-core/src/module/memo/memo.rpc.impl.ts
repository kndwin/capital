import { Effect } from "effect";
import { MemoRpcs } from "./memo.rpc.contract";
import { MemoService } from "./memo.service";

export const MemoLive = MemoRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* MemoService;
    return {
      MemoRenderPreview: Effect.fn("Rpc.MemoRenderPreview")(function* (input) {
        return yield* service.renderPreview(input);
      }),
      MemoSeedPreviewGet: Effect.fn("Rpc.MemoSeedPreviewGet")(function* () {
        return yield* service.renderSeedPreview();
      }),
    };
  }),
);
