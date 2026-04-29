export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void browser.storage.local.set({ apiBaseUrl: "http://localhost:38412" });
  });
});
