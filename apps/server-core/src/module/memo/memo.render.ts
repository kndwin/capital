import type {
  MemoRenderCheck,
  MemoRenderCheckGroup,
  MemoRenderCitation,
  MemoRenderInput,
  MemoRenderInsight,
  MemoRenderRecommendation,
  MemoRenderSource,
  MemoRenderVerdict,
} from "./memo.schema";

export const renderMemoHtml = (input: MemoRenderInput): string => {
  const sourceById = new Map(input.sources.map((source) => [source.id, source]));
  const checkById = new Map(
    input.checkGroups.flatMap((group) => group.checks.map((check) => [check.id, check] as const)),
  );
  const openItems = input.checkGroups.flatMap((group) =>
    group.checks
      .filter((check) => check.status === "unknown" || check.citations.length === 0)
      .map((check) => ({
        group,
        check,
      })),
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(input.company.name)} Investment Memo</title>
  <meta name="generator" content="Capital Memo">
  <style>
    @page { size: A4; margin: 18mm 20mm; background: #f5f4ed; }
    :root {
      --parchment: #f5f4ed;
      --ivory: #faf9f5;
      --brand: #1b365d;
      --brand-soft: #e4ecf5;
      --near-black: #141413;
      --dark-warm: #3d3d3a;
      --olive: #504e49;
      --stone: #6b6a64;
      --border: #e8e6dc;
      --border-soft: #e5e3d8;
      --error: #b53333;
      --serif: Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--parchment); color: var(--near-black); font-family: var(--serif); font-weight: 400; line-height: 1.55; }
    .memo { display: grid; gap: 18px; padding: 18px 0 48px; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 20mm; background: var(--parchment); box-shadow: 0 0 0 1pt var(--border), 0 4pt 24pt rgba(0,0,0,0.05); page-break-after: always; break-after: page; }
    .page:last-child { page-break-after: auto; break-after: auto; }
    .cover { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 28px; border-left: 3pt solid var(--brand); padding: 3px 0 6px 16px; }
    .eyebrow { color: var(--brand); font-size: 10px; font-weight: 600; letter-spacing: 0.22em; line-height: 1.35; text-transform: uppercase; }
    h1, h2, h3 { margin: 0; line-height: 1.08; }
    h1 { margin-top: 10px; font-size: 46px; font-weight: 500; letter-spacing: -0.04em; line-height: 1.1; }
    h2 { font-size: 24px; font-weight: 500; letter-spacing: -0.02em; line-height: 1.2; }
    h3 { font-size: 17px; font-weight: 500; line-height: 1.3; }
    p { margin: 0; }
    .deck { margin-top: 12px; max-width: 680px; color: var(--dark-warm); font-size: 18px; }
    .hero-score { min-width: 150px; text-align: right; }
    .hero-score-value { color: var(--near-black); font-size: 42px; font-weight: 500; line-height: 1; }
    .hero-score-label { margin-top: 8px; color: var(--stone); font-size: 14px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 28px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .metric { padding: 12px 18px 14px 0; }
    .metric-label { color: var(--stone); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }
    .metric-value { margin-top: 5px; color: var(--near-black); font-size: 20px; font-weight: 500; }
    .metric:first-child .metric-value { color: var(--brand); }
    .section { margin-top: 30px; }
    .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
    .card, .check-group, .evidence-card { break-inside: avoid; }
    .card { border: 0; background: transparent; padding: 0; }
    .headline { color: var(--near-black); font-size: 18px; font-weight: 500; line-height: 1.45; }
    .thesis { margin-top: 10px; color: var(--dark-warm); font-size: 16px; }
    .takeaways { display: grid; gap: 8px; margin: 18px 0 0; padding: 0; list-style: none; }
    .takeaways li { border-left: 2pt solid var(--brand); background: var(--ivory); padding: 10px 14px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .bullets { margin: 12px 0 0; padding-left: 20px; color: var(--dark-warm); }
    .check-group { margin-top: 14px; border-top: 1px solid var(--border); background: transparent; overflow: hidden; }
    .check-group-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; border-bottom: 1px solid var(--border-soft); padding: 14px 0; }
    .check-summary { margin-top: 6px; color: var(--stone); }
    .score-pill, .tag { display: inline-block; border: 0; background: var(--brand-soft); padding: 4px 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }
    .checks { display: grid; gap: 0; }
    .check { display: grid; grid-template-columns: 9rem minmax(0, 1fr) 5rem; gap: 14px; border-top: 1px solid var(--border-soft); padding: 12px 0; }
    .check:first-child { border-top: 0; }
    .status-pass { color: var(--brand); }
    .status-concern { color: var(--olive); }
    .status-fail { color: var(--error); }
    .status-unknown { color: var(--stone); }
    .check-title { font-weight: 500; }
    .detail { color: var(--stone); font-size: 13px; }
    .rationale { margin-top: 4px; color: var(--dark-warm); font-size: 14px; }
    .citations { margin-top: 7px; color: var(--stone); font-size: 12px; }
    .evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .evidence-card { border-left: 2pt solid var(--brand); background: var(--ivory); padding: 14px 16px; }
    .quote { margin-top: 9px; color: var(--dark-warm); font-size: 15px; }
    table { width: 100%; border-collapse: collapse; background: var(--ivory); }
    th, td { border: 0.5pt solid var(--border); padding: 10px 12px; text-align: left; vertical-align: top; }
    th { color: var(--stone); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
    .open-items { margin: 0; padding-left: 20px; }
    .muted { color: var(--stone); }
    @media print {
      body { background: var(--parchment); }
      .memo { display: block; padding: 0; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
    @media (max-width: 760px) {
      .memo { display: block; padding: 0; }
      .page { width: 100%; min-height: auto; padding: 24px 16px 48px; box-shadow: none; }
      .cover { grid-template-columns: 1fr; padding-left: 14px; }
      .hero-score { text-align: left; }
      h1 { font-size: 38px; }
      .meta-grid, .two-col, .evidence-grid { grid-template-columns: 1fr; }
      .check { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="memo">
    <article class="page">
      <section class="cover">
        <div>
          <div class="eyebrow">${escapeHtml(input.company.stage)} · ${escapeHtml(input.company.sector ?? "Uncategorized")}</div>
          <h1>${escapeHtml(input.company.name)}</h1>
          <p class="deck">${escapeHtml(input.company.description ?? "No company description supplied.")}</p>
        </div>
        <aside class="hero-score">
          <div class="hero-score-value">${formatScore(input.company.score)}</div>
          <div class="hero-score-label">Composite</div>
          <div class="hero-score-label">${formatRecommendation(input.company.recommendation)}</div>
        </aside>
      </section>

      <div class="meta-grid">
        <div class="metric"><div class="metric-value">${formatScore(input.company.score)}</div><div class="metric-label">Composite</div></div>
        <div class="metric"><div class="metric-value">${formatRecommendation(input.company.recommendation)}</div><div class="metric-label">Recommendation</div></div>
        <div class="metric"><div class="metric-value">${escapeHtml(input.company.location ?? "Unknown")}</div><div class="metric-label">Location</div></div>
        <div class="metric"><div class="metric-value">${escapeHtml(formatGeneratedAt(input.generatedAt))}</div><div class="metric-label">Generated</div></div>
      </div>

      <section class="section">
        <div class="section-head"><h2>Executive Summary</h2></div>
        <div class="card">
          <p class="headline">${escapeHtml(input.summary.headline)}</p>
          <p class="thesis">${escapeHtml(input.summary.thesis)}</p>
          <ul class="takeaways">${input.summary.keyTakeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Investment Read</h2></div>
        <div class="two-col">
          <div class="card"><h3>Why it works</h3><ul class="bullets">${input.summary.upside.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
          <div class="card"><h3>What must be resolved</h3><ul class="bullets">${input.summary.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        </div>
      </section>
    </article>

    <article class="page">
      <section class="section">
        <div class="section-head"><h2>Check Findings</h2><span class="muted">${input.checkGroups.length} groups</span></div>
        ${input.checkGroups.map(renderCheckGroup).join("")}
      </section>
    </article>

    <article class="page">
      <section class="section">
        <div class="section-head"><h2>Evidence</h2><span class="muted">${input.insights.length} insights</span></div>
        <div class="evidence-grid">${input.insights.map((insight) => renderInsight(insight, sourceById, checkById)).join("")}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Source Register</h2></div>
        <table>
          <thead><tr><th>Type</th><th>Source</th><th>Confidence</th><th>Notes</th></tr></thead>
          <tbody>${input.sources.map(renderSourceRow).join("")}</tbody>
        </table>
      </section>

      <section class="section">
        <div class="section-head"><h2>Appendix / Open Items</h2></div>
        <div class="card">${
          openItems.length === 0
            ? `<p class="muted">No open items derived from this seed memo.</p>`
            : `<ul class="open-items">${openItems.map(({ group, check }) => `<li>${escapeHtml(group.label)} · ${escapeHtml(check.label)}: ${escapeHtml(check.rationale)}</li>`).join("")}</ul>`
        }</div>
      </section>
    </article>
  </main>
</body>
</html>`;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatScore = (score: number | null): string => (score === null ? "--" : String(score));

const formatRecommendation = (recommendation: MemoRenderRecommendation): string => {
  switch (recommendation) {
    case "lean_in":
      return "Lean in";
    case "watch":
      return "Watch";
    case "pass":
      return "Pass";
    case "needs_work":
      return "Needs work";
  }
};

const statusLabel = (status: MemoRenderVerdict): string => {
  switch (status) {
    case "pass":
      return "Pass";
    case "concern":
      return "Concern";
    case "fail":
      return "Fail";
    case "unknown":
      return "Unknown";
  }
};

const statusClass = (status: MemoRenderVerdict): string => `status-${status}`;

const renderCitationList = (citations: ReadonlyArray<MemoRenderCitation>): string => {
  if (citations.length === 0) return `<div class="citations">No citations linked.</div>`;
  return `<div class="citations">${citations
    .map(
      (citation) =>
        `${escapeHtml(citation.label)}${citation.locator ? `, ${escapeHtml(citation.locator)}` : ""}`,
    )
    .join(" · ")}</div>`;
};

const renderCheckGroup = (group: MemoRenderCheckGroup): string => `<article class="check-group">
  <div class="check-group-head">
    <div><h3>${escapeHtml(group.label)}</h3><p class="check-summary">${escapeHtml(group.summary)}</p></div>
    <div><span class="score-pill">${escapeHtml(group.verdict)} · ${formatScore(group.score)}</span></div>
  </div>
  <div class="checks">${group.checks.map(renderCheck).join("")}</div>
</article>`;

const renderCheck = (check: MemoRenderCheck): string => `<div class="check">
  <div><span class="tag ${statusClass(check.status)}">${statusLabel(check.status)}</span></div>
  <div>
    <div class="check-title">${escapeHtml(check.label)}</div>
    <div class="detail">${escapeHtml(check.detail ?? "No detail supplied")}</div>
    <p class="rationale">${escapeHtml(check.rationale)}</p>
    ${renderCitationList(check.citations)}
  </div>
  <div class="detail">${formatScore(check.score)}</div>
</div>`;

const renderInsight = (
  insight: MemoRenderInsight,
  sourceById: ReadonlyMap<string, MemoRenderSource>,
  checkById: ReadonlyMap<string, MemoRenderCheck>,
): string => {
  const source = sourceById.get(insight.sourceId);
  const linkedChecks = insight.linkedCheckIds
    .map((id) => checkById.get(id)?.label ?? id)
    .map(escapeHtml)
    .join(", ");
  return `<article class="evidence-card">
    <div class="eyebrow">${escapeHtml(insight.kind)} · ${escapeHtml(source?.title ?? insight.sourceId)}${insight.locator ? `, ${escapeHtml(insight.locator)}` : ""}</div>
    <p class="quote">“${escapeHtml(insight.text)}”</p>
    <p class="citations">Linked checks: ${linkedChecks || "None"}</p>
  </article>`;
};

const renderSourceRow = (source: MemoRenderSource): string => `<tr>
  <td>${escapeHtml(source.kind)}</td>
  <td>${escapeHtml(source.title)}</td>
  <td>${formatScore(source.confidence)}%</td>
  <td>${escapeHtml(source.subtitle ?? "")}</td>
</tr>`;

const formatGeneratedAt = (generatedAt: number): string => String(generatedAt);
