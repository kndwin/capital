export function extractMoneyValues({ text }: { readonly text: string }) {
  return Array.from(text.matchAll(/\$\s*([0-9]+(?:\.[0-9]+)?)\s*([kKmM])?/g)).map((match) => {
    const value = Number(match[1]);
    const suffix = match[2]?.toLowerCase();
    if (suffix === "m") return value * 1_000_000;
    if (suffix === "k") return value * 1_000;
    return value;
  });
}

export function extractPercentValues({ text }: { readonly text: string }) {
  return Array.from(text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*%/g)).map((match) => Number(match[1]));
}

export function formatMoney({ value }: { readonly value: number }) {
  if (value >= 1_000_000) return `$${value / 1_000_000}M`;
  if (value >= 1_000) return `$${value / 1_000}k`;
  return `$${value}`;
}
