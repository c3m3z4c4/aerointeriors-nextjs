"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import Image from "next/image";

const PHOTOS = [
  "/assets/pics/webp/20190701_161734.webp",
  "/assets/pics/webp/20190701_161810.webp",
  "/assets/pics/webp/20190701_161812.webp",
  "/assets/pics/webp/20190701_165842.webp",
  "/assets/pics/webp/20190701_111200.webp",
  "/assets/pics/webp/20190701_111212.webp",
  "/assets/pics/webp/20190701_111218.webp",
  "/assets/pics/webp/20190701_111232.webp",
  "/assets/pics/webp/20190701_111251.webp",
];

const NUMBERS = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];

export default function Services() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal") ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <section id="services" ref={sectionRef} style={{ padding: "120px 0", background: "var(--charcoal)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: "72px" }}>
          <div className="reveal" style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.28em", color: "var(--gold)", textTransform: "uppercase" }}>
              {t.services.label}
            </span>
          </div>
          <h2 className="reveal" style={{
            fontFamily: "var(--font-cormorant, serif)",
            fontSize: "clamp(2.2rem, 5vw, 4rem)",
            fontWeight: 300, fontStyle: "italic",
            color: "var(--ivory)", margin: 0, lineHeight: 1.1,
          }}>
            {t.services.title}
          </h2>
        </div>

        {/* Service grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
          gap: "1px",
          background: "var(--border)",
        }}>
          {t.services.items.map((item, i) => (
            <div
              key={i}
              className="reveal service-card"
              style={{ transitionDelay: `${(i % 3) * 0.08}s` }}
            >
              {/* Photo */}
              <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                <Image
                  src={PHOTOS[i] || PHOTOS[0]}
                  alt={item.title}
                  fill
                  className="card-photo"
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, transparent 30%, rgba(10,8,5,0.85) 100%)",
                }} />
                {/* Number */}
                <div style={{
                  position: "absolute", top: "14px", right: "14px",
                  fontFamily: "var(--font-cormorant, serif)",
                  fontSize: "13px", fontWeight: 300, color: "rgba(201,168,76,0.5)",
                  letterSpacing: "0.1em",
                }}>
                  {NUMBERS[i]}
                </div>
              </div>

              {/* Text */}
              <div style={{ padding: "24px" }}>
                {/* Crimson top border */}
                <div style={{ width: "28px", height: "2px", background: "var(--crimson)", marginBottom: "14px" }} />
                <h3 style={{
                  fontFamily: "var(--font-cormorant, serif)",
                  fontSize: "1.3rem", fontWeight: 600,
                  color: "var(--ivory)", margin: "0 0 8px", lineHeight: 1.2,
                }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--steel)", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
