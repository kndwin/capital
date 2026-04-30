import { AtomRpc } from "effect/unstable/reactivity";
import type { MemoRenderInput } from "@capital/server-core/rpc";
import { ApiGroup, rpcProtocolLayer } from "@capital/client-api/rpc";

export class MemoClient extends AtomRpc.Service<MemoClient>()("client-ui/memo/MemoClient", {
  group: ApiGroup,
  protocol: rpcProtocolLayer("/api/rpc"),
}) {}

export const memoSeedPreviewAtom = MemoClient.query("MemoSeedPreviewGet", undefined);

export const memoRenderPreviewAtom = (input: MemoRenderInput) =>
  MemoClient.query("MemoRenderPreview", input);

export const memoListAtom = (companyId: string) =>
  MemoClient.query("MemoListByCompany", { companyId }, { reactivityKeys: [`memo:${companyId}`] });

export const generateMemoNarrative = MemoClient.mutation("MemoNarrativeGenerate");
