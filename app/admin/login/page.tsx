"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LangContext";
import { setToken } from "@/lib/auth";
import Image from "next/image";

export default function AdminLogin() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setToken(data.token);
      router.push("/admin/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100svh", background: "var(--void)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "url('/assets/pics/20190701_161734.jpg')",
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.07,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: "420px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "8px" }}>
            <Image src="/assets/img/AvionAPN.png" alt="AIS" width={32} height={32} style={{ objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "16px", fontWeight: 700, color: "var(--ivory)", letterSpacing: "0.12em" }}>
              AIRCRAFT INTERIORS
            </span>
          </div>
          <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: "var(--gold)", textTransform: "uppercase" }}>
            Admin Access
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          padding: "40px",
        }}>
          {/* Red top bar */}
          <div style={{ height: "2px", background: "var(--crimson)", margin: "-40px -40px 36px" }} />

          <h1 style={{
            fontFamily: "var(--font-cormorant, serif)",
            fontSize: "1.8rem", fontWeight: 300, fontStyle: "italic",
            color: "var(--ivory)", margin: "0 0 32px", textAlign: "center",
          }}>
            {t.admin.login}
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                {t.admin.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                {t.admin.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div style={{ background: "rgba(187,35,25,0.1)", border: "1px solid rgba(187,35,25,0.3)", padding: "12px 16px", fontSize: "13px", color: "var(--crimson)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-crimson" style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Signing in…" : t.admin.signIn}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" style={{ fontSize: "11px", color: "var(--steel)", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  );
}
