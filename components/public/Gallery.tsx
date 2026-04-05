"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const GALLERY = [
  { src: "/assets/pics/webp/20190701_111200.webp", aspect: "portrait" },
  { src: "/assets/pics/webp/20190701_111212.webp", aspect: "landscape" },
  { src: "/assets/pics/webp/20190701_111218.webp", aspect: "square" },
  { src: "/assets/pics/webp/20190701_111232.webp", aspect: "portrait" },
  { src: "/assets/pics/webp/20190701_111251.webp", aspect: "landscape" },
  { src: "/assets/pics/webp/20190701_111304.webp", aspect: "square" },
  { src: "/assets/pics/webp/20190701_111311.webp", aspect: "portrait" },
  { src: "/assets/pics/webp/20190701_111324.webp", aspect: "landscape" },
  { src: "/assets/pics/webp/20190701_111357.webp", aspect: "square" },
  { src: "/assets/pics/webp/20190701_111414.webp", aspect: "portrait" },
  { src: "/assets/pics/webp/20190701_111427.webp", aspect: "landscape" },
  { src: "/assets/pics/webp/20190701_161734.webp", aspect: "square" },
  { src: "/assets/pics/webp/20190701_161810.webp", aspect: "portrait" },
  { src: "/assets/pics/webp/20190701_161812.webp", aspect: "landscape" },
  { src: "/assets/pics/webp/20190701_165842.webp", aspect: "square" },
];

export default function Gallery() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal") ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Keyboard lightbox nav
  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((p) => (p !== null ? (p + 1) % GALLERY.length : null));
      if (e.key === "ArrowLeft") setLightbox((p) => (p !== null ? (p - 1 + GALLERY.length) % GALLERY.length : null));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  return (
    <section id="gallery" ref={sectionRef} style={{ padding: "120px 0" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: "64px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div className="reveal" style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.28em", color: "var(--gold)", textTransform: "uppercase" }}>
                {t.gallery.label}
              </span>
            </div>
            <h2 className="reveal" style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              fontWeight: 300, fontStyle: "italic",
              color: "var(--ivory)", margin: 0,
            }}>
              {t.gallery.title}
            </h2>
          </div>
          <p className="reveal" style={{ color: "var(--steel)", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {t.gallery.subtitle}
          </p>
        </div>

        {/* Masonry grid */}
        <div style={{
          columns: "4 220px",
          gap: "8px",
        }}>
          {GALLERY.map((img, i) => (
            <div
              key={i}
              className="reveal"
              onClick={() => setLightbox(i)}
              style={{
                breakInside: "avoid",
                marginBottom: "8px",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transitionDelay: `${(i % 4) * 0.06}s`,
              }}
            >
              <Image
                src={img.src}
                alt={`Gallery ${i + 1}`}
                width={400}
                height={img.aspect === "portrait" ? 540 : img.aspect === "landscape" ? 300 : 400}
                style={{
                  width: "100%", height: "auto",
                  display: "block",
                  transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)",
                }}
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* Hover overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(187,35,25,0.0)",
                transition: "background 0.4s",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(187,35,25,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(187,35,25,0)"; }}
              >
                <div style={{
                  width: "36px", height: "36px", border: "1px solid var(--ivory)",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0, transform: "scale(0.7)",
                  transition: "opacity 0.3s, transform 0.3s",
                }}>
                  <span style={{ fontSize: "14px", color: "var(--ivory)" }}>+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(10,8,5,0.96)", backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightbox(null)}
        >
          <button
            style={{ position: "absolute", top: "24px", right: "28px", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }}
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <button
            style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }}
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + GALLERY.length) % GALLERY.length); }}
          >
            <ChevronLeft size={32} />
          </button>
          <div
            style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={GALLERY[lightbox].src}
              alt="Gallery"
              width={1200}
              height={800}
              style={{ maxWidth: "90vw", maxHeight: "88vh", width: "auto", height: "auto", objectFit: "contain" }}
            />
          </div>
          <button
            style={{ position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }}
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % GALLERY.length); }}
          >
            <ChevronRight size={32} />
          </button>
          {/* Counter */}
          <div style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", color: "var(--steel)", fontSize: "12px", letterSpacing: "0.15em" }}>
            {lightbox + 1} / {GALLERY.length}
          </div>
        </div>
      )}
    </section>
  );
}
