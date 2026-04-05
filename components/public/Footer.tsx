"use client";

import { useLang } from "@/lib/i18n/LangContext";
import Image from "next/image";

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--charcoal)", borderTop: "1px solid var(--border)", padding: "60px 40px 40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "40px", flexWrap: "wrap", marginBottom: "48px" }}>
          {/* Brand */}
          <div style={{ maxWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Image src="/assets/img/AvionAPN.png" alt="AIS" width={32} height={32} style={{ objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "14px", fontWeight: 700, color: "var(--ivory)", letterSpacing: "0.1em" }}>AIRCRAFT</div>
                <div style={{ fontSize: "8.5px", letterSpacing: "0.2em", color: "var(--gold)" }}>INTERIORS SOLUTIONS</div>
              </div>
            </div>
            <p style={{ color: "var(--steel)", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
            <div>
              <h5 style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase", margin: "0 0 16px", fontWeight: 400 }}>
                Navigation
              </h5>
              {["about", "services", "gallery", "contact"].map((id) => (
                <a key={id} href={`#${id}`} style={{ display: "block", color: "var(--steel)", textDecoration: "none", fontSize: "13px", marginBottom: "10px", transition: "color 0.3s", textTransform: "capitalize" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--ivory)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--steel)")}
                >
                  {id}
                </a>
              ))}
            </div>
            <div>
              <h5 style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase", margin: "0 0 16px", fontWeight: 400 }}>
                Certifications
              </h5>
              {["FAA Part 145", "EASA Part-21", "AS9100D Quality"].map((cert) => (
                <div key={cert} style={{ color: "var(--steel)", fontSize: "13px", marginBottom: "10px" }}>{cert}</div>
              ))}
            </div>
          </div>

          {/* Crimson box */}
          <div style={{
            background: "var(--crimson)", padding: "28px",
            maxWidth: "220px",
          }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(245,240,232,0.7)", textTransform: "uppercase", marginBottom: "10px" }}>
              Ready to start?
            </div>
            <p style={{ color: "var(--ivory)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 20px" }}>
              Transform your aircraft interior into something extraordinary.
            </p>
            <a href="#contact" style={{
              color: "var(--ivory)", fontSize: "10px", letterSpacing: "0.2em",
              textTransform: "uppercase", textDecoration: "none",
              borderBottom: "1px solid rgba(245,240,232,0.4)", paddingBottom: "2px",
            }}>
              Contact Us →
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ color: "var(--steel)", fontSize: "11.5px", margin: 0 }}>
            © {year} Aircraft Interiors Solutions. {t.footer.rights}
          </p>
          <p style={{ color: "rgba(107,114,128,0.5)", fontSize: "10px", letterSpacing: "0.1em", margin: 0 }}>
            CRAFTED FOR THE SKIES
          </p>
        </div>
      </div>
    </footer>
  );
}
