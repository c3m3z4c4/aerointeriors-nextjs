"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const { t } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
    const timer = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="home"
      style={{
        position: "relative", height: "100svh", minHeight: "600px",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay loop muted playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          opacity: loaded ? 0.4 : 0,
          transition: "opacity 1.2s ease",
        }}
      >
        <source src="/assets/hero-main.mp4" type="video/mp4" />
      </video>

      {/* Multi-layer overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(10,8,5,0.3) 0%, rgba(10,8,5,0.1) 40%, rgba(10,8,5,0.7) 100%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(10,8,5,0.6) 0%, transparent 60%)",
      }} />

      {/* Crimson vertical accent line */}
      <div style={{
        position: "absolute", left: "10%", top: "15%", bottom: "15%",
        width: "1px",
        background: "linear-gradient(180deg, transparent, var(--crimson) 30%, var(--crimson) 70%, transparent)",
        opacity: loaded ? 0.6 : 0,
        transition: "opacity 1.5s 0.8s",
      }} />

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 10, padding: "0 5%" }}>
        {/* Tagline */}
        <div style={{
          marginBottom: "24px",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "none" : "translateY(20px)",
          transition: "all 0.9s 0.3s cubic-bezier(0.23,1,0.32,1)",
        }}>
          <span style={{
            fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase",
            color: "var(--gold)", fontFamily: "var(--font-outfit, sans-serif)", fontWeight: 400,
          }}>
            ✦ &nbsp;{t.hero.tagline}&nbsp; ✦
          </span>
        </div>

        {/* Massive type */}
        <div style={{ overflow: "hidden" }}>
          <h1 style={{ margin: 0, lineHeight: 0.88, fontFamily: "var(--font-cormorant, serif)" }}>
            {[t.hero.line1, t.hero.line2, t.hero.line3].map((line, i) => (
              <div
                key={i}
                style={{
                  display: "block", overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "clamp(4rem, 12vw, 9rem)",
                    fontWeight: i === 2 ? 700 : 300,
                    fontStyle: i === 1 ? "italic" : "normal",
                    color: i === 2 ? "var(--crimson)" : "var(--ivory)",
                    lineHeight: 1,
                    transform: loaded ? "translateY(0)" : "translateY(110%)",
                    transition: `transform 1s ${0.4 + i * 0.12}s cubic-bezier(0.23,1,0.32,1)`,
                    letterSpacing: i === 2 ? "0.04em" : "-0.01em",
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
          </h1>
        </div>

        {/* CTAs */}
        <div style={{
          marginTop: "48px", display: "flex", gap: "16px", flexWrap: "wrap",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "none" : "translateY(20px)",
          transition: "all 1s 0.85s cubic-bezier(0.23,1,0.32,1)",
        }}>
          <a href="#services" className="btn-crimson">{t.hero.cta}</a>
          <a href="#contact" className="btn-outline">{t.hero.ctaSecondary}</a>
        </div>

        {/* Certification badge */}
        <div style={{
          marginTop: "40px", display: "flex", alignItems: "center", gap: "12px",
          opacity: loaded ? 1 : 0,
          transition: "opacity 1.2s 1.1s",
        }}>
          <div style={{
            width: "36px", height: "36px", border: "1px solid var(--crimson)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: "8px", color: "var(--crimson)", fontWeight: 700, letterSpacing: "0.05em" }}>FAA</span>
          </div>
          <span style={{ fontSize: "10.5px", letterSpacing: "0.15em", color: "var(--steel)", textTransform: "uppercase" }}>
            Part 145 Certified Repair Station
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: "absolute", bottom: "36px", left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
        opacity: loaded ? 1 : 0, transition: "opacity 1.5s 1.5s",
      }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "var(--steel)", textTransform: "uppercase" }}>
          {t.hero.scroll}
        </span>
        <div style={{ animation: "bounce 2s ease-in-out infinite" }}>
          <ArrowDown size={14} color="var(--steel)" />
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
      </div>
    </section>
  );
}
