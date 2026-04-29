export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    browser.runtime.onMessage.addListener((message) => {
      if (!isCaptureRequest(message)) return;
      return Promise.resolve(capturePage());
    });
  },
});

type PageCapture = {
  readonly title: string;
  readonly url: string;
  readonly selectedText: string | null;
  readonly visibleText: string;
};

function isCaptureRequest(message: unknown): message is { readonly type: "capital:capture-page" } {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "capital:capture-page"
  );
}

function capturePage(): PageCapture {
  const selection = window.getSelection()?.toString().trim() || null;
  const visibleText = (document.body?.innerText ?? "").replace(/\n{3,}/g, "\n\n").trim();
  return {
    title: document.title || location.hostname,
    url: location.href,
    selectedText: selection,
    visibleText,
  };
}
