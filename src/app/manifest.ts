import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moments",
    short_name: "Moments",
    description: "Share your moments",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#4f6bff",
    icons: [{ src: "/logo.png", sizes: "205x205", type: "image/png", purpose: "any" }],
  };
}
