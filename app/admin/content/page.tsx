"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Save, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type Settings = Record<string, string>;

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

const TABS = ["hero", "sections", "colors", "companyData", "ai"] as const;
type Tab = typeof TABS[number];

export default function ContentPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("hero");
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${API}/api/site-settings/admin?orgId=${ORG}`, { headers: authHeaders() });
    if (res.ok) setSettings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings(s => ({ ...s, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    const res = await fetch(`${API}/api/site-settings`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ orgId: ORG, ...settings }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  }

  async function uploadImage(field: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (res.ok) {
      const { path } = await res.json();
      setSettings(s => ({ ...s, [field]: path }));
    }
  }

  if (loading) return <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: "13px", letterSpacing: "0.18em", color: "var(--ivory)", textTransform: "uppercase", margin: 0 }}>
          {t.admin.content}
        </h2>
        <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: saving ? "rgba(187,35,25,0.05)" : "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: saved ? "#4ade80" : "var(--ivory)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.3s" }}>
          <Save size={14} /> {saved ? t.admin.saved : saving ? "Saving…" : t.admin.save}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "0" }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            padding: "10px 20px", background: "none", border: "none", borderBottom: `2px solid ${tab === tb ? "var(--crimson)" : "transparent"}`,
            color: tab === tb ? "var(--ivory)" : "var(--steel)", fontSize: "12px", letterSpacing: "0.1em", cursor: "pointer",
            textTransform: "uppercase",
          }}>
            {t.admin[tb as keyof typeof t.admin] as string || tb}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {tab === "hero" && (
          <>
            <BilingualField label="Tagline" enKey="heroTagline_en" esKey="heroTagline_es" s={settings} set={set} />
            <BilingualField label="Title" enKey="heroTitle_en" esKey="heroTitle_es" s={settings} set={set} />
            <Field label="Title Highlight"><input value={settings.heroTitleHighlight || ""} onChange={set("heroTitleHighlight")} className="field" /></Field>
            <BilingualField label="CTA Button 1" enKey="heroCta1_en" esKey="heroCta1_es" s={settings} set={set} />
            <BilingualField label="CTA Button 2" enKey="heroCta2_en" esKey="heroCta2_es" s={settings} set={set} />
          </>
        )}

        {tab === "sections" && (
          <>
            <BilingualField label="Projects Section Title" enKey="projectsSectionTitle_en" esKey="projectsSectionTitle_es" s={settings} set={set} />
            <BilingualField label="Services Section Title" enKey="servicesSectionTitle_en" esKey="servicesSectionTitle_es" s={settings} set={set} />
            <BilingualField label="Team Section Title" enKey="teamSectionTitle_en" esKey="teamSectionTitle_es" s={settings} set={set} />
            <BilingualField label="Certifications Section Title" enKey="certSectionTitle_en" esKey="certSectionTitle_es" s={settings} set={set} />
            <BilingualField label="Contact Section Title" enKey="contactSectionTitle_en" esKey="contactSectionTitle_es" s={settings} set={set} />
            <BilingualField label="Footer Text" enKey="footerText_en" esKey="footerText_es" s={settings} set={set} />
          </>
        )}

        {tab === "colors" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <ColorField label="Primary Color (Light)" fieldKey="primaryColorLight" s={settings} set={set} />
            <ColorField label="Primary Color (Dark)" fieldKey="primaryColorDark" s={settings} set={set} />
            <ColorField label="Background (Light)" fieldKey="bgColorLight" s={settings} set={set} />
            <ColorField label="Background (Dark)" fieldKey="bgColorDark" s={settings} set={set} />
          </div>
        )}

        {tab === "companyData" && (
          <>
            <Field label="Company Name"><input value={settings.companyName || ""} onChange={set("companyName")} className="field" /></Field>
            <Field label="Email"><input type="email" value={settings.email || ""} onChange={set("email")} className="field" /></Field>
            <Field label="Phone"><input value={settings.phone || ""} onChange={set("phone")} className="field" /></Field>
            <Field label="Address"><input value={settings.address || ""} onChange={set("address")} className="field" /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <ImageUploadField label="Company Logo" fieldKey="companyLogo" s={settings} onUpload={uploadImage} />
              <ImageUploadField label="Favicon" fieldKey="favicon" s={settings} onUpload={uploadImage} />
            </div>
          </>
        )}

        {tab === "ai" && (
          <>
            <Field label="AI Provider">
              <select value={settings.aiProvider || ""} onChange={e => setSettings(s => ({ ...s, aiProvider: e.target.value }))} className="field">
                <option value="">None</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
              </select>
            </Field>
            <Field label="AI Model"><input value={settings.aiModel || ""} onChange={set("aiModel")} className="field" placeholder="e.g. gpt-4o, claude-3-5-sonnet" /></Field>
            <Field label="System Prompt"><textarea value={settings.aiSystemPrompt || ""} onChange={set("aiSystemPrompt")} className="field" rows={5} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="OpenAI API Key"><input type="password" value={settings.openaiKey || ""} onChange={set("openaiKey")} className="field" /></Field>
              <Field label="Anthropic API Key"><input type="password" value={settings.anthropicKey || ""} onChange={set("anthropicKey")} className="field" /></Field>
              <Field label="Gemini API Key"><input type="password" value={settings.geminiKey || ""} onChange={set("geminiKey")} className="field" /></Field>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{label}</label>
      {children}
    </div>
  );
}

function BilingualField({ label, enKey, esKey, s, set }: { label: string; enKey: string; esKey: string; s: Settings; set: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }) {
  return (
    <div>
      <div style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--steel)", display: "block", marginBottom: "4px" }}>EN</label>
          <input value={s[enKey] || ""} onChange={set(enKey)} className="field" />
        </div>
        <div>
          <label style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--steel)", display: "block", marginBottom: "4px" }}>ES</label>
          <input value={s[esKey] || ""} onChange={set(esKey)} className="field" />
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, fieldKey, s, set }: { label: string; fieldKey: string; s: Settings; set: (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.18em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <input type="color" value={s[fieldKey] || "#000000"} onChange={set(fieldKey)} style={{ width: "40px", height: "36px", border: "1px solid var(--border)", background: "none", cursor: "pointer", padding: "2px" }} />
        <input value={s[fieldKey] || ""} onChange={set(fieldKey)} className="field" style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function ImageUploadField({ label, fieldKey, s, onUpload }: { label: string; fieldKey: string; s: Settings; onUpload: (k: string, f: File) => void }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.18em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>{label}</label>
      {s[fieldKey] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${API}${s[fieldKey]}`} alt={label} style={{ height: "48px", objectFit: "contain", marginBottom: "8px", border: "1px solid var(--border)", padding: "4px" }} />
      )}
      <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px dashed var(--border)", color: "var(--steel)", fontSize: "11px", cursor: "pointer", letterSpacing: "0.1em" }}>
        <Upload size={13} /> Upload
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onUpload(fieldKey, e.target.files[0])} />
      </label>
    </div>
  );
}
