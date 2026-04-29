import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { ApiGroup } from "@capital/client-api/rpc";
import "./style.css";

type Company = {
  readonly id: string;
  readonly name: string;
};

type PageCapture = {
  readonly title: string;
  readonly url: string;
  readonly selectedText: string | null;
  readonly visibleText: string;
};

type State = {
  readonly apiBaseUrl: string;
  readonly companies: ReadonlyArray<Company>;
  readonly selectedCompanyId: string;
  readonly capture: PageCapture | null;
  readonly status: string;
  readonly error: string | null;
  readonly busy: boolean;
};

const maxCaptureChars = 80_000;
const app = document.querySelector<HTMLDivElement>("#app");

let state: State = {
  apiBaseUrl: "http://localhost:38412",
  companies: [],
  selectedCompanyId: "",
  capture: null,
  status: "Capture this tab, choose a company, and add it as a source.",
  error: null,
  busy: false,
};

void init();

async function init() {
  render();
  const stored = await browser.storage.local.get("apiBaseUrl");
  if (typeof stored.apiBaseUrl === "string" && stored.apiBaseUrl.trim()) {
    state = { ...state, apiBaseUrl: stored.apiBaseUrl.trim() };
  }
  await Promise.all([loadCompanies(), captureCurrentTab()]);
}

async function loadCompanies() {
  await withBusy("Loading companies...", async () => {
    const companies = await runRpc((client) => client.CompanyList(undefined));
    state = {
      ...state,
      companies,
      selectedCompanyId: state.selectedCompanyId || companies[0]?.id || "",
      status: companies.length === 0 ? "Create a company in Capital first." : state.status,
    };
  });
}

async function captureCurrentTab() {
  await withBusy("Reading current tab...", async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return Promise.reject(new Error("No active tab found"));
    const capture = await browser.tabs.sendMessage(tab.id, { type: "capital:capture-page" });
    if (!isPageCapture(capture)) {
      return Promise.reject(new Error("Could not read this page. Refresh it and try again."));
    }
    state = { ...state, capture, status: "Page captured. Choose a company and add it." };
  });
}

async function submitSource() {
  if (!state.capture) return;
  const companyId = state.selectedCompanyId;
  if (!companyId) {
    state = { ...state, error: "Choose a company first." };
    render();
    return;
  }
  await withBusy("Adding source...", async () => {
    const sourceText = formatSourceText(state.capture!);
    await runRpc((client) =>
      client.CompanySourceCreate({
        companyId,
        kind: "note",
        title: `Browser capture: ${state.capture!.title}`,
        text: sourceText,
      }),
    );
    state = { ...state, status: "Source added. Capital is extracting insights now.", error: null };
  });
}

async function withBusy(status: string, task: () => Promise<void>) {
  state = { ...state, busy: true, status, error: null };
  render();
  await Promise.try(task)
    .catch((error: unknown) => {
      state = { ...state, error: error instanceof Error ? error.message : "Something went wrong" };
    })
    .finally(() => {
      state = { ...state, busy: false };
      render();
    });
}

type CapitalRpcClient = {
  readonly CompanyList: (input: undefined) => Effect.Effect<ReadonlyArray<Company>, unknown>;
  readonly CompanySourceCreate: (input: {
    readonly companyId: string;
    readonly kind: "note";
    readonly title: string | null;
    readonly text: string;
  }) => Effect.Effect<unknown, unknown>;
};

async function runRpc<A>(fn: (client: CapitalRpcClient) => Effect.Effect<A, unknown>) {
  const protocol = RpcClient.layerProtocolHttp({
    url: `${state.apiBaseUrl.replace(/\/$/, "")}/api/rpc`,
  }).pipe(Layer.provide(RpcSerialization.layerNdjson), Layer.provide(FetchHttpClient.layer));
  return await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        const client = yield* RpcClient.make(ApiGroup);
        return yield* fn(client as CapitalRpcClient);
      }),
    ).pipe(Effect.provide(protocol)),
  );
}

function formatSourceText(capture: PageCapture) {
  const selected = capture.selectedText ? `Selected text:\n${capture.selectedText}\n\n` : "";
  return [
    `Captured from browser`,
    `URL: ${capture.url}`,
    `Title: ${capture.title}`,
    "",
    selected + `Page text:\n${capture.visibleText}`,
  ]
    .join("\n")
    .slice(0, maxCaptureChars);
}

function isPageCapture(value: unknown): value is PageCapture {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string" &&
    "url" in value &&
    typeof value.url === "string" &&
    "visibleText" in value &&
    typeof value.visibleText === "string"
  );
}

function render() {
  if (!app) return;
  app.innerHTML = `
    <section class="shell">
      <header>
        <div class="brand">
          <img src="/logo.svg" alt="" />
          <span>Capital</span>
        </div>
        <div>
          <p class="eyebrow">Browser source</p>
          <h1>Add page evidence</h1>
        </div>
      </header>

      <label>
        API URL
        <input id="apiBaseUrl" value="${escapeHtml(state.apiBaseUrl)}" />
      </label>

      <label>
        Company
        <select id="company" ${state.busy ? "disabled" : ""}>
          ${state.companies
            .map(
              (company) => `
            <option value="${escapeHtml(company.id)}" ${company.id === state.selectedCompanyId ? "selected" : ""}>
              ${escapeHtml(company.name)}
            </option>
          `,
            )
            .join("")}
        </select>
      </label>

      <div class="preview">
        <strong>${escapeHtml(state.capture?.title ?? "No page captured yet")}</strong>
        <span>${escapeHtml(state.capture?.url ?? "")}</span>
        <p>${escapeHtml(previewText(state.capture))}</p>
      </div>

      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <p class="status">${escapeHtml(state.status)}</p>

      <div class="actions">
        <button id="refresh" type="button" ${state.busy ? "disabled" : ""}>Refresh</button>
        <button id="submit" type="button" ${state.busy || !state.capture || !state.selectedCompanyId ? "disabled" : ""}>Add source</button>
      </div>
    </section>
  `;
  bindEvents();
}

function bindEvents() {
  document.querySelector("#refresh")?.addEventListener("click", () => {
    void Promise.all([loadCompanies(), captureCurrentTab()]);
  });
  document.querySelector("#submit")?.addEventListener("click", () => {
    void submitSource();
  });
  document.querySelector<HTMLSelectElement>("#company")?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLSelectElement;
    state = { ...state, selectedCompanyId: target.value };
    render();
  });
  document.querySelector<HTMLInputElement>("#apiBaseUrl")?.addEventListener("change", (event) => {
    const target = event.currentTarget as HTMLInputElement;
    const apiBaseUrl = target.value.trim() || "http://localhost:38412";
    state = { ...state, apiBaseUrl };
    void browser.storage.local.set({ apiBaseUrl });
    render();
  });
}

function previewText(capture: PageCapture | null) {
  if (!capture) return "Click refresh if this tab loaded before the extension was installed.";
  const text = capture.selectedText || capture.visibleText;
  return text.slice(0, 260) || "This page has no readable text.";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
