"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const FALLBACK = [
  "/assets/pics/webp/20190701_111200.webp",
  "/assets/pics/webp/20190701_111212.webp",
  "/assets/pics/webp/20190701_111218.webp",
  "/assets/pics/webp/20190701_111232.webp",
  "/assets/pics/webp/20190701_111251.webp",
  "/assets/pics/webp/20190701_111304.webp",
  "/assets/pics/webp/20190701_111311.webp",
  "/assets/pics/webp/20190701_111324.webp",
  "/assets/pics/webp/20190701_111357.webp",
  "/assets/pics/webp/20190701_111414.webp",
  "/assets/pics/webp/20190701_111427.webp",
  "/assets/pics/webp/20190701_161734.webp",
  "/assets/pics/webp/20190701_161810.webp",
  "/assets/pics/webp/20190701_161812.webp",
  "/assets/pics/webp/20190701_165842.webp",
];

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type Project = { id: string; title_en: string; title_es: string; description_en: string; description_es: string; images: string[]; category: string; aircraftType: string; year: number; visible: boolean };

export default function Gallery() {
  const { t, lang } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/projects?orgId=${ORG}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Project[]) => { setProjects(data.filter(p => p.visible)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  // Build flat image list from projects, or fall back
  const images: { src: string; title?: string; desc?: string }[] = loaded && projects.length > 0
    ? projects.flatMap(p => p.images.map((src, i) => ({
        src,
        title: i === 0 ? (lang === "es" ? p.title_es : p.title_en) : undefined,
        desc: i === 0 ? (lang === "es" ? p.description_es : p.description_en) : undefined,
      })))
    : FALLBACK.map(src => ({ src }));

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal") ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [images.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox(p => p !== null ? (p + 1) % images.length : null);
      if (e.key === "ArrowLeft") setLightbox(p => p !== null ? (p - 1 + images.length) % images.length : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, images.length]);

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
            <h2 className="reveal" style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: 0 }}>
              {t.gallery.title}
            </h2>
          </div>
          <p className="reveal" style={{ color: "var(--steel)", fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {t.gallery.subtitle}
          </p>
        </div>

        {/* Masonry grid */}
        <div style={{ columns: "4 220px", gap: "8px" }}>
          {images.map((img, i) => (
            <div
              key={i}
              className="reveal"
              onClick={() => setLightbox(i)}
              style={{ breakInside: "avoid", marginBottom: "8px", position: "relative", overflow: "hidden", cursor: "pointer", transitionDelay: `${(i % 4) * 0.06}s` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.title || `Gallery ${i + 1}`}
                style={{ width: "100%", height: "auto", display: "block", transition: "transform 0.6s cubic-bezier(0.23,1,0.32,1)" }}
                loading="lazy"
              />
              {/* Hover overlay */}
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(187,35,25,0.0)", transition: "background 0.4s", display: "flex", alignItems: "flex-end", padding: "12px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(187,35,25,0.25)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(187,35,25,0)"; }}
              >
                {img.title && (
                  <div style={{ fontSize: "11px", color: "var(--ivory)", letterSpacing: "0.08em", textShadow: "0 1px 4px rgba(0,0,0,0.8)", opacity: 0, transition: "opacity 0.3s" }}
                    className="gallery-caption"
                  >
                    {img.title}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,8,5,0.96)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightbox(null)}
        >
          <button style={{ position: "absolute", top: "24px", right: "28px", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }} onClick={() => setLightbox(null)}>
            <X size={24} />
          </button>
          <button style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }}
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length); }}>
            <ChevronLeft size={32} />
          </button>
          <div style={{ maxWidth: "90vw", maxHeight: "90vh", position: "relative" }} onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[lightbox].src} alt="" style={{ maxWidth: "90vw", maxHeight: "80vh", width: "auto", height: "auto", objectFit: "contain" }} />
            {images[lightbox].title && (
              <div style={{ marginTop: "12px", textAlign: "center", color: "var(--ivory)", fontSize: "13px", letterSpacing: "0.1em" }}>
                {images[lightbox].title}
              </div>
            )}
          </div>
          <button style={{ position: "absolute", right: "24px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", zIndex: 2 }}
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length); }}>
            <ChevronRight size={32} />
          </button>
          <div style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", color: "var(--steel)", fontSize: "12px", letterSpacing: "0.15em" }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}
