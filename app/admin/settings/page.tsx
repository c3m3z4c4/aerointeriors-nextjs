"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, Trash2, KeyRound, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type AdminUser = { id: string; name: string; email: string; role: string; createdAt: string };
type Settings = Record<string, string>;

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function currentUserId(): string {
  try {
    const token = getToken();
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || "";
  } catch { return ""; }
}

export default function SettingsPage() {
  const { t } = useLang();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const myId = currentUserId();

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`${API}/api/auth/users`, { headers: authHeaders() });
    if (res.ok) setUsers(await res.json());
    setLoadingUsers(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch(`${API}/api/site-settings/admin?orgId=${ORG}`, { headers: authHeaders() });
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => { fetchUsers(); fetchSettings(); }, [fetchUsers, fetchSettings]);

  async function deleteUser(id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await fetch(`${API}/api/auth/users/${id}`, { method: "DELETE", headers: authHeaders() });
    setUsers(u => u.filter(x => x.id !== id));
  }

  async function addAdmin(data: { name: string; email: string; password: string }) {
    const res = await fetch(`${API}/api/auth/users`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...data, role: "admin" }) });
    if (res.ok) { await fetchUsers(); setShowAddAdmin(false); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  }

  async function resetPassword(userId: string, newPassword: string) {
    const res = await fetch(`${API}/api/auth/users/${userId}/password`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify({ newPassword }),
    });
    if (res.ok) setResetTarget(null);
    else alert("Error resetting password");
  }

  async function saveCompanySettings() {
    setSavingSettings(true);
    const res = await fetch(`${API}/api/site-settings`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({ orgId: ORG, companyName: settings.companyName, email: settings.email, phone: settings.phone, address: settings.address }),
    });
    if (res.ok) { setSavedSettings(true); setTimeout(() => setSavedSettings(false), 2500); }
    setSavingSettings(false);
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setSettings(s => ({ ...s, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", maxWidth: "800px" }}>
      {/* Admin Users */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--ivory)", textTransform: "uppercase", margin: 0 }}>
            {t.admin.adminUsers}
          </h2>
          <button onClick={() => setShowAddAdmin(true)} style={btnStyle}>
            <Plus size={14} /> {t.admin.addAdmin}
          </button>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {loadingUsers && <p style={{ padding: "16px", color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}
          {users.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500 }}>
                  {u.name} {u.id === myId && <span style={{ fontSize: "10px", color: "var(--gold)", letterSpacing: "0.1em", marginLeft: "8px" }}>YOU</span>}
                </div>
                <div style={{ fontSize: "11px", color: "var(--steel)", marginTop: "2px" }}>{u.email}</div>
              </div>
              <span style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold)", border: "1px solid rgba(212,175,55,0.3)", padding: "2px 8px" }}>{u.role}</span>
              <span style={{ fontSize: "11px", color: "var(--steel)" }}>{new Date(u.createdAt).toLocaleDateString()}</span>
              <button onClick={() => setResetTarget(u)} style={iconBtn} title={t.admin.resetPassword}><KeyRound size={14} /></button>
              {u.id !== myId && (
                <button onClick={() => deleteUser(u.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Company Data */}
      <section>
        <h2 style={{ fontSize: "11px", letterSpacing: "0.22em", color: "var(--ivory)", textTransform: "uppercase", margin: "0 0 16px" }}>
          {t.admin.companyData}
        </h2>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field label="Company Name"><input value={settings.companyName || ""} onChange={set("companyName")} className="field" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Field label="Email"><input type="email" value={settings.email || ""} onChange={set("email")} className="field" /></Field>
            <Field label="Phone"><input value={settings.phone || ""} onChange={set("phone")} className="field" /></Field>
          </div>
          <Field label="Address"><input value={settings.address || ""} onChange={set("address")} className="field" /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={saveCompanySettings} disabled={savingSettings} style={{ ...btnStyle, color: savedSettings ? "#4ade80" : "var(--ivory)" }}>
              {savedSettings ? t.admin.saved : savingSettings ? "Saving…" : t.admin.save}
            </button>
          </div>
        </div>
      </section>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <Modal title={t.admin.addAdmin} onClose={() => setShowAddAdmin(false)}>
          <AddAdminForm t={t.admin} onSave={addAdmin} onCancel={() => setShowAddAdmin(false)} />
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal title={`${t.admin.resetPassword} — ${resetTarget.name}`} onClose={() => setResetTarget(null)}>
          <ResetPasswordForm t={t.admin} onSave={pw => resetPassword(resetTarget.id, pw)} onCancel={() => setResetTarget(null)} />
        </Modal>
      )}
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "440px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function AddAdminForm({ t: tRaw, onSave, onCancel }: { t: Record<string, unknown>; onSave: (d: { name: string; email: string; password: string }) => void; onCancel: () => void }) {
  const t = tRaw as Record<string, string>;
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label="Name"><input value={form.name} onChange={set("name")} className="field" required /></Field>
      <Field label={t.email}><input type="email" value={form.email} onChange={set("email")} className="field" required /></Field>
      <Field label={t.password}><input type="password" value={form.password} onChange={set("password")} className="field" required minLength={8} /></Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={secBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ t: tRaw, onSave, onCancel }: { t: Record<string, unknown>; onSave: (pw: string) => void; onCancel: () => void }) {
  const t = tRaw as Record<string, string>;
  const [pw, setPw] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(pw); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label={t.newPassword}>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="field" required minLength={8} />
      </Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={secBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

const btnStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: "var(--ivory)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer" };
