"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import Image from "next/image";

export default function About() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal") ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const stats = [
    { val: t.about.stat1, label: t.about.stat1label },
    { val: t.about.stat2, label: t.about.stat2label },
    { val: t.about.stat3, label: t.about.stat3label },
  ];

  return (
    <section id="about" ref={sectionRef} style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      {/* Background texture line */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: "42%",
        background: "var(--surface)",
        clipPath: "polygon(8% 0, 100% 0, 100% 100%, 0% 100%)",
        zIndex: 0,
      }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Left: image stack */}
          <div className="reveal" style={{ position: "relative", aspectRatio: "3/4", maxHeight: "600px" }}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <Image
                src="/assets/pics/20190701_111357.jpg"
                alt="Aircraft interior craftsmanship"
                fill
                style={{ objectFit: "cover", objectPosition: "center" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Decorative frame */}
            <div style={{
              position: "absolute", top: "-16px", left: "-16px",
              width: "60%", height: "60%",
              border: "1px solid rgba(201,168,76,0.2)",
              pointerEvents: "none",
              zIndex: 2,
            }} />
            <div style={{
              position: "absolute", bottom: "-16px", right: "-16px",
              width: "50%", height: "50%",
              border: "1px solid rgba(187,35,25,0.2)",
              pointerEvents: "none",
              zIndex: 2,
            }} />
            {/* Crimson corner accent */}
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: "3px", height: "80px",
              background: "var(--crimson)",
              zIndex: 3,
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: "80px", height: "3px",
              background: "var(--crimson)",
              zIndex: 3,
            }} />
          </div>

          {/* Right: content */}
          <div>
            <div className="reveal" style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.28em", color: "var(--gold)", textTransform: "uppercase", fontFamily: "var(--font-outfit, sans-serif)" }}>
                {t.about.label}
              </span>
            </div>

            <h2 className="reveal" style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 400, fontStyle: "italic",
              color: "var(--ivory)", lineHeight: 1.2,
              margin: "0 0 8px",
            }}>
              {t.about.title}
            </h2>
            <span className="rule reveal" style={{ margin: "16px 0 28px" }} />

            <p className="reveal" style={{ color: "var(--ivory-dim)", fontSize: "15px", lineHeight: 1.85, marginBottom: "16px" }}>
              {t.about.p1}
            </p>
            <p className="reveal" style={{ color: "var(--ivory-dim)", fontSize: "15px", lineHeight: 1.85, marginBottom: "48px" }}>
              {t.about.p2}
            </p>

            {/* Stats */}
            <div className="reveal" style={{ display: "flex", gap: "40px" }}>
              {stats.map((s, i) => (
                <div key={i} style={{ position: "relative" }}>
                  {i > 0 && <div style={{ position: "absolute", left: "-20px", top: "4px", bottom: "4px", width: "1px", background: "var(--border)" }} />}
                  <div style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2.6rem", fontWeight: 700, color: "var(--crimson)", lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "10px", letterSpacing: "0.18em", color: "var(--steel)", textTransform: "uppercase", marginTop: "4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #about .grid-cols-2 { grid-template-columns: 1fr !important; }
          #about [style*="grid"] { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
