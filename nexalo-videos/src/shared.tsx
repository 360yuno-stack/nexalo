import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

// ── Brand colors ──────────────────────────────────────────
export const NEON = "#00FF41";
export const BG   = "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0a0a15 100%)";

// ── Reusable slide layout ─────────────────────────────────
interface SlideProps {
  number: string;
  color: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const SlideLayout: React.FC<SlideProps> = ({ number, color, title, subtitle, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = spring({ frame, fps, config: { damping: 20 } });
  const slideY = interpolate(fadeIn, [0, 1], [60, 0]);

  return (
    <div style={{
      width: "100%", height: "100%",
      background: BG,
      fontFamily: "'Space Mono', 'Courier New', monospace",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      overflow: "hidden", position: "relative",
    }}>
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,65,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0,255,65,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* NEXALO logo top-left */}
      <div style={{ position: "absolute", top: 48, left: 64, display: "flex", alignItems: "center", gap: 16, opacity: fadeIn }}>
        <div style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${NEON}, #00cc33)`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>⚡</div>
        <span style={{ fontSize: 28, fontWeight: 900, color: NEON, letterSpacing: 2, textShadow: `0 0 20px ${NEON}60` }}>NEXALO</span>
      </div>

      {/* Video number badge */}
      <div style={{ position: "absolute", top: 48, right: 64, opacity: fadeIn }}>
        <div style={{ border: `2px solid ${color}40`, borderRadius: 24, padding: "6px 20px", color, fontSize: 14, fontWeight: 900, letterSpacing: 4 }}>
          {number}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        opacity: fadeIn,
        transform: `translateY(${slideY}px)`,
        textAlign: "center", padding: "0 120px", maxWidth: 1400,
      }}>
        <div style={{ fontSize: 22, color: color, letterSpacing: 6, marginBottom: 24, fontWeight: 700 }}>{subtitle.toUpperCase()}</div>
        <h1 style={{
          fontSize: 96, fontWeight: 900, color: "#fff",
          lineHeight: 1.1, marginBottom: 40,
          textShadow: `0 0 40px ${color}40`,
        }}>{title}</h1>
        {children}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center", color: "#ffffff30", fontSize: 13, letterSpacing: 3 }}>
        NEXALO PROTOCOL · BSC BLOCKCHAIN · {new Date().getFullYear()}
      </div>
    </div>
  );
};

// ── Bullet list helper ────────────────────────────────────
export const BulletList: React.FC<{ items: string[]; color: string }> = ({ items, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "32px auto", maxWidth: 800, textAlign: "left" }}>
      {items.map((item, i) => {
        const delay = i * 8;
        const opacity = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const x = interpolate(frame, [delay, delay + 20], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20, opacity, transform: `translateX(${x}px)` }}>
            <span style={{ color, fontSize: 24, marginTop: 2 }}>▸</span>
            <span style={{ color: "#e2e8f0", fontSize: 28, lineHeight: 1.4 }}>{item}</span>
          </li>
        );
      })}
    </ul>
  );
};
