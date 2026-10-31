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
          background: "#f8f6f1",
          color: "#292824",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 20, letterSpacing: 8, color: "#7a6455", textTransform: "uppercase" }}>{siteConfig.market}</div>
        <div style={{ fontSize: 120, letterSpacing: 40, marginTop: 30, marginRight: -40 }}>AURELLE</div>
        <div style={{ width: 80, height: 1, background: "#b99f8d", marginTop: 30 }} />
        <div style={{ fontSize: 36, fontStyle: "italic", marginTop: 30, color: "#6b675f" }}>{siteConfig.tagline}</div>
      </div>
    ),
    size,
  );
}
