import { Effect } from "effect";
import { ErrorMemoNarrative, MemoRpcs } from "./memo.rpc.contract";
import { ErrorMemoAi, MemoService } from "./memo.service";

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
      MemoNarrativeGenerate: Effect.fn("Rpc.MemoNarrativeGenerate")(function* (payload) {
        return yield* service.generateNarrative(payload).pipe(
          Effect.catchTags({
            ErrorMemoAi: (error: ErrorMemoAi) =>
              Effect.fail(new ErrorMemoNarrative({ reason: error.reason })),
          }),
        );
      }),
      MemoListByCompany: Effect.fn("Rpc.MemoListByCompany")(function* (payload) {
        return yield* service.listByCompany(payload.companyId);
      }),
    };
  }),
);
