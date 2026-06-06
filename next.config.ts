import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Settings for the WebContainer connection page
      // Required for previewing project in a seperate tab
      // https://github.com/stackblitz/webcontainer-core/issues/1725
      {
        source: "/webcontainer/connect/:id*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
      // Settings for the rest of the app (all other pages) required by webcontainer
      {
        source: "/((?!webcontainer/connect/).*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
