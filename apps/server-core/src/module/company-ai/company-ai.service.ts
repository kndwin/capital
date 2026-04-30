import { Buffer } from "node:buffer";
import { OpenAiClient, OpenAiLanguageModel, OpenAiTool } from "@effect/ai-openai";
import { Config, Context, Effect, Layer, Schema } from "effect";
import { AiError, LanguageModel, Prompt, Toolkit } from "effect/unstable/ai";
import { FetchHttpClient } from "effect/unstable/http";
import {
  CompanySourceAcquiredContent,
  type Company,
  type CompanySource,
} from "../company/company.schema";
import { capSourceText, getMaxAiInputChars } from "../company/company.util";
import { CompanyAiSourceExtraction } from "./company-ai.schema";

const withModuleLogs = Effect.annotateLogs({ module: "company-ai" });

export class ErrorCompanyAi extends Schema.TaggedErrorClass<ErrorCompanyAi>()("ErrorCompanyAi", {
  reason: AiError.AiErrorReason,
}) {
  static fromAiError(error: AiError.AiError) {
    return new ErrorCompanyAi({ reason: error.reason });
  }
}

export class ErrorCompanyAiInvalidResponse extends Schema.TaggedErrorClass<ErrorCompanyAiInvalidResponse>()(
  "ErrorCompanyAiInvalidResponse",
  { message: Schema.String },
) {}

const CompanySourceWebSearch = OpenAiTool.WebSearch({
  search_context_size: "medium",
});

const CompanySourceToolkit = Toolkit.make(CompanySourceWebSearch);

const OpenAiClientLive = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer));

export class CompanyAiService extends Context.Service<
  CompanyAiService,
  {
    readonly extractSourceInsights: (input: {
      readonly company: Company;
      readonly source: CompanySource;
      readonly text?: string;
      readonly fileBase64?: string;
    }) => Effect.Effect<
      {
        readonly extraction: typeof CompanyAiSourceExtraction.Type;
        readonly acquired: CompanySourceAcquiredContent | null;
      },
      ErrorCompanyAi | ErrorCompanyAiInvalidResponse
    >;
  }
>()("module/CompanyAiService") {
  static readonly layer = Layer.effect(
    CompanyAiService,
    Effect.gen(function* () {
      const toolkit = CompanySourceToolkit;
      const model = yield* OpenAiLanguageModel.model("gpt-5.5");

      const extractSourceInsights = Effect.fn("CompanyAiService.extractSourceInsights")(
        function* (input: {
          readonly company: Company;
          readonly source: CompanySource;
          readonly text?: string;
          readonly fileBase64?: string;
        }) {
          yield* Effect.annotateCurrentSpan({
            "company.id": input.company.id,
            "company_source.id": input.source.id,
          });

          if (input.source.kind === "url") {
            if (!input.source.url) {
              return yield* new ErrorCompanyAiInvalidResponse({
                message: "URL source is missing url",
              });
            }
            const acquired = yield* acquireUrlContent(input.source);
            const response = yield* LanguageModel.generateObject({
              objectName: "company_source_extraction",
              schema: CompanyAiSourceExtraction,
              prompt: buildExtractionPrompt({
                company: input.company,
                source: input.source,
                text: acquired.text,
                truncatedNote: acquired.textTruncated
                  ? "\n\nThe source text was truncated to fit the extraction context."
                  : "",
              }),
            });
            return { extraction: response.value, acquired };
          }

          if (input.source.kind === "chat") {
            if (!input.text) {
              return yield* new ErrorCompanyAiInvalidResponse({
                message: "AI research source is missing prompt",
              });
            }
            const response = yield* LanguageModel.generateText({
              prompt: buildChatExtractionPrompt({
                company: input.company,
                source: input.source,
                prompt: input.text,
              }),
              toolkit,
              toolChoice: "required",
            });
            const extraction = yield* decodeExtractionResponse(response.text);
            const acquired = buildWebSearchAcquiredContent({
              source: input.source,
              text: response.text,
            });
            return { extraction, acquired };
          }

          if (input.source.kind === "pdf") {
            if (!input.fileBase64) {
              return yield* new ErrorCompanyAiInvalidResponse({
                message: "PDF source is missing file data",
              });
            }
            const response = yield* LanguageModel.generateText({
              prompt: Prompt.fromMessages([
                Prompt.makeMessage("user", {
                  content: [
                    Prompt.makePart("text", {
                      text: buildPdfExtractionPrompt({
                        company: input.company,
                        source: input.source,
                      }),
                    }),
                    Prompt.makePart("file", {
                      mediaType: "application/pdf",
                      fileName: input.source.fileName ?? input.source.title,
                      data: Buffer.from(input.fileBase64, "base64"),
                    }),
                  ],
                }),
              ]),
            });
            const extraction = yield* decodeExtractionResponse(response.text);
            const acquired = buildOpenAiFileAcquiredContent({
              source: input.source,
              text: response.text,
            });
            return { extraction, acquired };
          }

          if (!input.text) {
            return yield* new ErrorCompanyAiInvalidResponse({
              message: "Stored source has no text",
            });
          }
          const maxAiInputChars = getMaxAiInputChars({ unit: undefined });
          const sourceText = input.text.slice(0, maxAiInputChars);
          const truncatedNote =
            input.text.length > maxAiInputChars
              ? "\n\nThe source text was truncated to fit the extraction context."
              : "";
          const response = yield* LanguageModel.generateObject({
            objectName: "company_source_extraction",
            schema: CompanyAiSourceExtraction,
            prompt: buildExtractionPrompt({
              company: input.company,
              source: input.source,
              text: sourceText,
              truncatedNote,
            }),
          });

          return { extraction: response.value, acquired: null };
        },
        Effect.provide(model),
        Effect.catchTags({
          AiError: (error: AiError.AiError) => Effect.fail(ErrorCompanyAi.fromAiError(error)),
        }),
        withModuleLogs,
      );

      return CompanyAiService.of({ extractSourceInsights });
    }),
  ).pipe(Layer.provide(OpenAiClientLive));
}

export const CompanyAiServiceLive = CompanyAiService.layer;

const buildExtractionPrompt = (input: {
  readonly company: Company;
  readonly source: CompanySource;
  readonly text?: string;
  readonly truncatedNote?: string;
}) =>
  [
    "You extract venture diligence evidence from source material.",
    "Only return facts directly supported by the source text.",
    "Do not infer unsupported claims. Prefer concise excerpts, metrics, and claims useful for evaluating team, market, product, traction, financials, and deal risk.",
    "Return an empty insights array if the source has no useful diligence evidence.",
    'Return only minified JSON matching this shape: {"summary": string|null, "insights": [{"kind": "excerpt"|"metric"|"claim"|"note", "locator": string|null, "text": string, "confidence": number}] }.',
    input.source.kind === "url" && input.source.url
      ? `Use web search/tool access to inspect this URL before answering: ${input.source.url}`
      : "Use the provided source text below.",
    `Company: ${input.company.name}`,
    `Stage: ${input.company.stage}`,
    `Sector: ${input.company.sector ?? "unknown"}`,
    `Source title: ${input.source.title}`,
    `Source kind: ${input.source.kind}`,
    input.truncatedNote ?? "",
    input.text ? `Source text:\n${input.text}` : "",
  ].join("\n");

const buildChatExtractionPrompt = (input: {
  readonly company: Company;
  readonly source: CompanySource;
  readonly prompt: string;
}) =>
  [
    "You are doing web research for venture diligence.",
    "Use web search/tool access to find the most relevant public web sources for the user's research prompt.",
    "Only return facts directly supported by web-accessible sources you found.",
    "Do not infer unsupported claims. Prefer concise excerpts, metrics, and claims useful for evaluating team, market, product, traction, financials, and deal risk.",
    "Include source names or URLs in each locator when possible.",
    "Return an empty insights array if the web search has no useful diligence evidence.",
    'Return only minified JSON matching this shape: {"summary": string|null, "insights": [{"kind": "excerpt"|"metric"|"claim"|"note", "locator": string|null, "text": string, "confidence": number}] }.',
    `Company: ${input.company.name}`,
    `Website: ${input.company.website ?? "unknown"}`,
    `Stage: ${input.company.stage}`,
    `Sector: ${input.company.sector ?? "unknown"}`,
    `Source title: ${input.source.title}`,
    `Research prompt:\n${input.prompt}`,
  ].join("\n");

const buildPdfExtractionPrompt = (input: {
  readonly company: Company;
  readonly source: CompanySource;
}) =>
  [
    "You extract venture diligence evidence from an attached PDF source.",
    "Only return facts directly supported by the PDF.",
    "Do not infer unsupported claims. Prefer concise excerpts, metrics, and claims useful for evaluating team, market, product, traction, financials, and deal risk.",
    "Return an empty insights array if the PDF has no useful diligence evidence or cannot be read.",
    'Return only minified JSON matching this shape: {"summary": string|null, "insights": [{"kind": "excerpt"|"metric"|"claim"|"note", "locator": string|null, "text": string, "confidence": number}] }.',
    `Company: ${input.company.name}`,
    `Stage: ${input.company.stage}`,
    `Sector: ${input.company.sector ?? "unknown"}`,
    `Source title: ${input.source.title}`,
    `File name: ${input.source.fileName ?? input.source.title}`,
  ].join("\n");

const acquireUrlContent = Effect.fn("acquireUrlContent")(function* (
  source: CompanySource,
): Effect.fn.Return<CompanySourceAcquiredContent, ErrorCompanyAiInvalidResponse> {
  if (!source.url) {
    return yield* new ErrorCompanyAiInvalidResponse({ message: "URL source is missing url" });
  }
  const url = source.url;
  const response = yield* Effect.tryPromise({
    try: () =>
      fetch(url, {
        headers: {
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "user-agent": "CapitalSourceIngest/1.0",
        },
        redirect: "follow",
      }),
    catch: () => new ErrorCompanyAiInvalidResponse({ message: "URL source could not be fetched" }),
  });
  if (!response.ok) {
    return yield* new ErrorCompanyAiInvalidResponse({
      message: `URL source returned HTTP ${response.status}`,
    });
  }
  const html = yield* Effect.tryPromise({
    try: () => response.text(),
    catch: () => new ErrorCompanyAiInvalidResponse({ message: "URL source could not be read" }),
  });
  const capped = capSourceText({ text: htmlToText(html) });
  if (!capped.text.trim()) {
    return yield* new ErrorCompanyAiInvalidResponse({ message: "URL source had no readable text" });
  }
  return {
    provider: "url_fetch",
    title: source.title,
    finalUrl: response.url || url,
    text: capped.text,
    textCharCount: capped.charCount,
    textTruncated: capped.truncated,
    textHash: capped.hash,
  };
});

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const buildWebSearchAcquiredContent = (input: {
  readonly source: CompanySource;
  readonly text: string;
}): CompanySourceAcquiredContent => {
  const capped = capSourceText({ text: input.text });
  return {
    provider: "openai_web_search",
    title: input.source.title,
    finalUrl: input.source.url,
    text: capped.text,
    textCharCount: capped.charCount,
    textTruncated: capped.truncated,
    textHash: capped.hash,
  };
};

const buildOpenAiFileAcquiredContent = (input: {
  readonly source: CompanySource;
  readonly text: string;
}): CompanySourceAcquiredContent => {
  const capped = capSourceText({ text: input.text });
  return {
    provider: "openai_file",
    title: input.source.fileName ?? input.source.title,
    finalUrl: null,
    text: capped.text,
    textCharCount: capped.charCount,
    textTruncated: capped.truncated,
    textHash: capped.hash,
  };
};

const decodeExtractionResponse = Effect.fn("decodeExtractionResponse")(function* (text: string) {
  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return yield* Effect.try({
    try: () => Schema.decodeUnknownSync(Schema.fromJsonString(CompanyAiSourceExtraction))(jsonText),
    catch: () =>
      new ErrorCompanyAiInvalidResponse({ message: "AI extraction response schema was invalid" }),
  });
});
