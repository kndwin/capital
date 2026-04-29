import { createHash } from "node:crypto";
import type { CompanySourceAcquiredContent } from "./company.schema";

const maxSourceTextChars = 120_000;
const maxAiInputChars = 80_000;

export function hashSourceText({ text }: { readonly text: string }) {
  return createHash("sha256").update(text).digest("hex");
}

export function getMaxAiInputChars({ unit: _unit }: { readonly unit: undefined }) {
  return maxAiInputChars;
}

export function toCompanyId({ name }: { readonly name: string }) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "company";
}

export function capSourceText({
  text,
  maxChars = maxSourceTextChars,
}: {
  readonly text: string;
  readonly maxChars?: number;
}) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  return {
    text: normalized.slice(0, maxChars),
    charCount: normalized.length,
    truncated: normalized.length > maxChars,
    hash: hashSourceText({ text: normalized }),
  };
}

export function acquireNoteContent({
  text,
}: {
  readonly text: string;
}): CompanySourceAcquiredContent {
  const capped = capSourceText({ text });
  return {
    provider: "user_note",
    title: null,
    finalUrl: null,
    text: capped.text,
    textCharCount: capped.charCount,
    textTruncated: capped.truncated,
    textHash: capped.hash,
  };
}
