import { ImageResponse } from "next/og";
import { defaultDescription, siteName } from "@/lib/seo";

export const runtime = "edge";
export const alt = `${siteName} - AI Resume Builder`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F172A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: 200,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-1px",
            }}
          >
            R
          </span>
        </div>

        {/* Site name */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              color: "#F1F5F9",
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            resu
          </span>
          <span
            style={{
              color: "#0EA5E9",
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            ify
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "#94A3B8",
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.4,
            maxWidth: 700,
            marginBottom: 48,
          }}
        >
          {defaultDescription}
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["AI-Powered", "ATS-Optimized", "Beat the Bots"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(14,165,233,0.12)",
                border: "1px solid rgba(14,165,233,0.25)",
                color: "#7DD3FC",
                fontSize: 18,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
