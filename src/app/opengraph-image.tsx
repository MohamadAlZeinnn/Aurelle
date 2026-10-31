import { ImageResponse } from "next/og";
import { siteConfig } from "@/data/site-config";

export const alt = "AURELLE — The Art of Slowing Down";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Typographic share card. Replace with a campaign photograph once available.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#3a2730",
          color: "#f5efe6",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 20, letterSpacing: 8, color: "#e2a273", textTransform: "uppercase" }}>{siteConfig.market}</div>
        <div style={{ fontSize: 120, letterSpacing: 40, marginTop: 30, marginRight: -40 }}>AURELLE</div>
        <div style={{ width: 80, height: 1, background: "#c27a4a", marginTop: 30 }} />
        <div style={{ fontSize: 36, fontStyle: "italic", marginTop: 30, color: "#cdbdb3" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
