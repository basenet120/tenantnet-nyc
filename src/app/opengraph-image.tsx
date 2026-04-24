import { ImageResponse } from "next/og";

export const alt = "TENANTNET.NYC — Private tenant forums for NYC apartment buildings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1a1a1a",
          padding: "64px 72px",
          position: "relative",
          fontFamily: "sans-serif",
          color: "#f5f0eb",
        }}
      >
        {/* Terracotta signature bar along the top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            background: "#c45d3e",
          }}
        />

        {/* Overline */}
        <div
          style={{
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#b0a99e",
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          For 449 W 125th St & every NYC tenant
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            textTransform: "uppercase",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>TENANT</span>
          <span>
            NET<span style={{ color: "#c45d3e" }}>.NYC</span>
          </span>
        </div>

        {/* Subtitle with terracotta left border */}
        <div
          style={{
            marginTop: 32,
            paddingLeft: 20,
            borderLeft: "4px solid #c45d3e",
            fontSize: 28,
            lineHeight: 1.25,
            maxWidth: 880,
            display: "flex",
          }}
        >
          Your building&rsquo;s private forum — report issues, document
          disputes, connect with neighbors.
        </div>

        {/* Stat strip */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: "auto",
            fontSize: 16,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#b0a99e",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#c45d3e", letterSpacing: 0 }}>
              100%
            </span>
            <span>Free forever</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#f5f0eb", letterSpacing: 0 }}>
              QR
            </span>
            <span>Door-scan access</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#f5f0eb", letterSpacing: 0 }}>
              NYC
            </span>
            <span>Built for the five boroughs</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
