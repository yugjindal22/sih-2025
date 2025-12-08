import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GeoVision Observatory - Earth Observation Platform",
    short_name: "GeoVision",
    description:
      "GPT-OSS Multimodal Platform for ISRO Earth Observation Data - SIH 2025",
    id: "/",
    start_url: "/",
    display: "standalone",
    scope: "/",
    lang: "en",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard overview",
      },
      {
        src: "/screenshot-mobile.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile experience",
      },
    ],
  };
}
