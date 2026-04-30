import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { Config, Context, Effect, Layer, Schema } from "effect";
import { AiError, LanguageModel } from "effect/unstable/ai";
import { FetchHttpClient } from "effect/unstable/http";
import { AcmeMemoRenderInput } from "./memo.seed";
import {
  MemoNarrative,
  type MemoNarrativeConfig,
  type MemoRecord,
  type MemoRenderInput,
  type MemoRenderOutput,
} from "./memo.schema";
import { MemoRepo } from "./memo.repo";
import { renderMemoHtml } from "./memo.render";

const withModuleLogs = Effect.annotateLogs({ module: "memo" });

export class ErrorMemoAi extends Schema.TaggedErrorClass<ErrorMemoAi>()("ErrorMemoAi", {
  reason: AiError.AiErrorReason,
}) {
  static fromAiError(error: AiError.AiError) {
    return new ErrorMemoAi({ reason: error.reason });
  }
}

const OpenAiClientLive = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer));

export class MemoService extends Context.Service<MemoService>()("module/MemoService", {
  make: Effect.gen(function* () {
    const model = yield* OpenAiLanguageModel.model("gpt-5.5");

    const renderPreview = Effect.fn("MemoService.renderPreview")(function* (
      input: MemoRenderInput,
    ) {
      yield* Effect.void;
      return { html: renderMemoHtml(input) } satisfies MemoRenderOutput;
    }, withModuleLogs);

    const renderSeedPreview = Effect.fn("MemoService.renderSeedPreview")(function* () {
      return yield* renderPreview(AcmeMemoRenderInput);
    }, withModuleLogs);

    const generateNarrative = Effect.fn("MemoService.generateNarrative")(
      function* (params: {
        readonly input: MemoRenderInput;
        readonly config: MemoNarrativeConfig;
      }) {
        const repo = yield* MemoRepo;
        yield* Effect.annotateCurrentSpan({
          "company.id": params.input.company.id,
          "memo.maxPages": params.config.maxPages,
        });
        const response = yield* LanguageModel.generateObject({
          objectName: "memo_narrative",
          schema: MemoNarrative,
          prompt: buildNarrativePrompt(params.input, params.config),
        });
        const record = yield* repo
          .save({
            id: crypto.randomUUID(),
            companyId: params.input.company.id,
            narrative: response.value,
            config: params.config,
          })
          .pipe(Effect.orDie);
        return record satisfies MemoRecord;
      },
      Effect.provide(model),
      Effect.catchTags({
        AiError: (error: AiError.AiError) => Effect.fail(ErrorMemoAi.fromAiError(error)),
      }),
      withModuleLogs,
    );

    const listByCompany = Effect.fn("MemoService.listByCompany")(function* (companyId: string) {
      const repo = yield* MemoRepo;
      return yield* repo.listByCompany(companyId).pipe(Effect.orDie);
    }, withModuleLogs);

    return { renderPreview, renderSeedPreview, generateNarrative, listByCompany } as const;
  }),
}) {}

export const MemoServiceLive = Layer.effect(MemoService, MemoService.make).pipe(
  Layer.provide(OpenAiClientLive),
);

const pageBudget = (config: MemoNarrativeConfig): string => {
  switch (config.maxPages) {
    case 1:
      return "Hard target: the entire memo must fit on a single A4 page. Be ruthless.";
    case 2:
      return "Target two A4 pages of editorial density.";
    case 3:
      return "Target up to three A4 pages.";
  }
};

const fieldBudget = (
  config: MemoNarrativeConfig,
): { takeawayMax: number; upDownMax: number; execWords: string } => {
  switch (config.maxPages) {
    case 1:
      return { takeawayMax: 3, upDownMax: 2, execWords: "40-70 words" };
    case 2:
      return { takeawayMax: 4, upDownMax: 3, execWords: "60-100 words" };
    case 3:
      return { takeawayMax: 5, upDownMax: 4, execWords: "90-130 words" };
  }
};

const buildNarrativePrompt = (input: MemoRenderInput, config: MemoNarrativeConfig): string => {
  const company = input.company;
  const budget = fieldBudget(config);
  const checkLines = input.checkGroups.flatMap((group) => [
    `- ${group.label} [${group.verdict}${group.score === null ? "" : ` ${group.score}`}]: ${group.summary}`,
    ...group.checks.map(
      (check) =>
        `  - ${check.label} [${check.status} ${check.score}]${check.detail ? ` ${check.detail}` : ""}: ${check.rationale}`,
    ),
  ]);
  const insightLines = input.insights.slice(0, 12).map((insight) => `- ${insight.text}`);

  return [
    "You are a venture analyst writing a short investment memo narrative.",
    pageBudget(config),
    "Write tightly. Every line must add information. No filler, no marketing tone, no hedging adverbs.",
    "Ground every claim in the supplied checks and insights. Do not invent facts.",
    "If evidence is missing or conflicting, say so plainly.",
    "",
    "Return JSON matching the MemoNarrative schema with these fields:",
    "- headline: one sentence, ≤ 18 words, the single most important takeaway.",
    "- thesis: 1-2 sentences, ≤ 50 words, why this is or isn't an investment.",
    `- executiveSummary: a single paragraph, ${budget.execWords}, terse partner-meeting framing.`,
    `- keyTakeaways: up to ${budget.takeawayMax} bullets, each ≤ 18 words, the must-know facts.`,
    `- upside: up to ${budget.upDownMax} bullets, each ≤ 14 words, only what the evidence supports.`,
    `- risks: up to ${budget.upDownMax} bullets, each ≤ 14 words, only material unresolved concerns.`,
    "",
    `Company: ${company.name}`,
    `Stage: ${company.stage}`,
    `Sector: ${company.sector ?? "unknown"}`,
    `Location: ${company.location ?? "unknown"}`,
    `Composite score: ${company.score ?? "n/a"}`,
    `Recommendation: ${company.recommendation}`,
    `Description: ${company.description ?? "none"}`,
    "",
    "Checks:",
    ...checkLines,
    "",
    "Insights (evidence excerpts):",
    ...insightLines,
  ].join("\n");
};
