"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangContext";
import { Menu, X, Sun, Moon } from "lucide-react";
import Image from "next/image";

const SECTIONS = ["about", "services", "gallery", "contact"] as const;

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("ais-theme") as "dark" | "light" | null;
    const initial = stored || "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("ais-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return { theme, toggle };
}

export default function Header() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const { theme, toggle } = useTheme();
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

  const isLight = theme === "light";

  return (
    <>
      <header
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          padding: scrolled ? "14px 40px" : "22px 40px",
          background: scrolled
            ? isLight ? "rgba(248,245,240,0.95)" : "rgba(10,8,5,0.92)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled
            ? isLight ? "1px solid rgba(187,35,25,0.12)" : "1px solid rgba(201,168,76,0.08)"
            : "none",
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
          <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }}>
            <Image
              src="/assets/img/AvionAPN.png"
              alt="AIS"
              fill
              style={{
                objectFit: "contain",
                // Force white logo on dark hero, adapt on scroll
                filter: isLight && scrolled
                  ? "brightness(0) saturate(1) invert(15%) sepia(90%) saturate(700%) hue-rotate(345deg)"
                  : "brightness(0) invert(1) drop-shadow(0 0 6px rgba(201,168,76,0.5))",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{
              fontFamily: "var(--font-cormorant, serif)", fontSize: "15px", fontWeight: 700,
              color: isLight && scrolled ? "var(--void)" : "var(--ivory)",
              letterSpacing: "0.12em",
            }}>AIRCRAFT</span>
            <span style={{
              fontFamily: "var(--font-outfit, sans-serif)", fontSize: "9px",
              letterSpacing: "0.22em", color: "var(--crimson)", textTransform: "uppercase",
            }}>INTERIORS SOLUTIONS</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "36px" }} className="hide-mobile">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`nav-link ${active === item.href.slice(1) ? "active" : ""}`}
              style={{
                color: isLight && scrolled ? "var(--void)" : undefined,
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Dark/Light toggle */}
          <button
            onClick={toggle}
            aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: "50%",
              color: isLight && scrolled ? "var(--void)" : "var(--ivory-dim)",
              transition: "color 0.3s, background 0.3s",
            }}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Language toggle */}
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {(["en", "es"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "9.5px", letterSpacing: "0.18em", textTransform: "uppercase",
                  color: lang === l ? "var(--crimson)" : isLight && scrolled ? "rgba(10,8,5,0.5)" : "var(--steel)",
                  fontFamily: "var(--font-outfit, sans-serif)",
                  fontWeight: lang === l ? 700 : 400,
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
            style={{
              background: "none", border: "none",
              color: isLight && scrolled ? "var(--void)" : "var(--ivory)",
              cursor: "pointer", display: "none",
            }}
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
            background: isLight ? "rgba(248,245,240,0.98)" : "rgba(10,8,5,0.97)",
            backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column", padding: "32px",
          }}
        >
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute", top: "24px", right: "28px",
              background: "none", border: "none",
              color: isLight ? "var(--void)" : "var(--ivory)",
              cursor: "pointer",
            }}
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
                  color: isLight ? "var(--void)" : "var(--ivory)",
                  textDecoration: "none",
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
