import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Capital Capture",
    description: "Capture the current browser page as a Capital company source.",
    icons: {
      16: "/icons/icon-16.png",
      32: "/icons/icon-32.png",
      48: "/icons/icon-48.png",
      128: "/icons/icon-128.png",
    },
    permissions: ["activeTab", "storage"],
    host_permissions: ["http://localhost:38412/*", "http://localhost:47823/*"],
    action: {
      default_title: "Add to Capital",
      default_icon: {
        16: "/icons/icon-16.png",
        32: "/icons/icon-32.png",
        48: "/icons/icon-48.png",
        128: "/icons/icon-128.png",
      },
    },
  },
});
