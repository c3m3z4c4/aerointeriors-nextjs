"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangContext";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const SECTIONS = ["about", "services", "gallery", "contact"] as const;

export default function Header() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const logoClickRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActive(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Hidden admin: 5 clicks within 2.5s
  const handleLogoClick = useCallback(() => {
    const ref = logoClickRef.current;
    ref.count += 1;
    if (ref.timer) clearTimeout(ref.timer);
    if (ref.count >= 5) {
      ref.count = 0;
      router.push("/admin/login");
      return;
    }
    ref.timer = setTimeout(() => { ref.count = 0; }, 2500);
  }, [router]);

  const navItems = [
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#gallery", label: t.nav.gallery },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          padding: scrolled ? "14px 40px" : "22px 40px",
          background: scrolled ? "rgba(10,8,5,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(201,168,76,0.08)" : "none",
          transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "10px" }}
          aria-label="Home"
        >
          <Image
            src="/assets/img/AvionAPN.png"
            alt="AIS"
            width={36}
            height={36}
            style={{ objectFit: "contain", filter: "brightness(1.1)" }}
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "15px", fontWeight: 700, color: "var(--ivory)", letterSpacing: "0.12em" }}>AIRCRAFT</span>
            <span style={{ fontFamily: "var(--font-outfit, sans-serif)", fontSize: "9px", letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase" }}>INTERIORS SOLUTIONS</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "36px" }} className="hide-mobile">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={`nav-link ${active === item.href.slice(1) ? "active" : ""}`}>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Language toggle */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: lang === l ? "var(--gold)" : "var(--steel)",
                  fontFamily: "var(--font-outfit, sans-serif)",
                  fontWeight: lang === l ? 600 : 400,
                  transition: "color 0.3s",
                  padding: "4px 2px",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", display: "none" }}
            className="show-mobile"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(10,8,5,0.97)", backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column", padding: "32px",
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{ position: "absolute", top: "24px", right: "28px", background: "none", border: "none", color: "var(--ivory)", cursor: "pointer" }}
          >
            <X size={24} />
          </button>
          <div style={{ marginTop: "80px", display: "flex", flexDirection: "column", gap: "32px" }}>
            {navItems.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: "var(--font-cormorant, serif)",
                  fontSize: "clamp(2rem, 10vw, 3.5rem)",
                  fontWeight: 300, fontStyle: "italic",
                  color: "var(--ivory)", textDecoration: "none",
                  lineHeight: 1, opacity: 0,
                  animation: `fadeSlide 0.5s ${i * 0.07}s forwards`,
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
          <style>{`
            @keyframes fadeSlide {
              from { opacity: 0; transform: translateX(-20px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          header { padding-left: 20px !important; padding-right: 20px !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
