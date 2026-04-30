import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { AiError } from "effect/unstable/ai";
import {
  MemoListByCompanyInput,
  MemoNarrativeGenerateInput,
  MemoRecord,
  MemoRenderInput,
  MemoRenderOutput,
} from "./memo.schema";

export class ErrorMemoNarrative extends Schema.TaggedErrorClass<ErrorMemoNarrative>()(
  "ErrorMemoNarrative",
  { reason: AiError.AiErrorReason },
) {}

export class MemoRenderPreview extends Rpc.make("MemoRenderPreview", {
  payload: MemoRenderInput,
  success: MemoRenderOutput,
}) {}

export class MemoSeedPreviewGet extends Rpc.make("MemoSeedPreviewGet", {
  success: MemoRenderOutput,
}) {}

export class MemoNarrativeGenerate extends Rpc.make("MemoNarrativeGenerate", {
  payload: MemoNarrativeGenerateInput,
  success: MemoRecord,
  error: ErrorMemoNarrative,
}) {}

export class MemoListByCompany extends Rpc.make("MemoListByCompany", {
  payload: MemoListByCompanyInput,
  success: Schema.Array(MemoRecord),
}) {}

export const MemoRpcs = RpcGroup.make(
  MemoRenderPreview,
  MemoSeedPreviewGet,
  MemoNarrativeGenerate,
  MemoListByCompany,
);
