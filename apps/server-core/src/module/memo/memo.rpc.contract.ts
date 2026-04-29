import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { MemoRenderInput, MemoRenderOutput } from "./memo.schema";

export class MemoRenderPreview extends Rpc.make("MemoRenderPreview", {
  payload: MemoRenderInput,
  success: MemoRenderOutput,
}) {}

export class MemoSeedPreviewGet extends Rpc.make("MemoSeedPreviewGet", {
  success: MemoRenderOutput,
}) {}

export const MemoRpcs = RpcGroup.make(MemoRenderPreview, MemoSeedPreviewGet);
