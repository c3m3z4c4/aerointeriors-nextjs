"use client";

import { useState, useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Download, Upload, Save, RotateCcw, Clock, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

type BackupFile = { filename: string; size: number; createdAt: string };
type Schedule = { enabled: boolean; frequency: string; orgId?: string };

export default function BackupPage() {
  const { t: { admin: t } } = useLang();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({ enabled: false, frequency: "daily" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const clientFileRef = useRef<HTMLInputElement>(null);
  const kanbanFileRef = useRef<HTMLInputElement>(null);
  const restoreFileRef = useRef<HTMLInputElement>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/backup/list`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
        setSchedule(data.schedule || { enabled: false, frequency: "daily" });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  // ── Export full JSON (download) ───────────────────────────────────────────
  const exportJson = async () => {
    setBusy("export");
    try {
      const res = await fetch(`${API}/api/backup/export?orgId=${ORG}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      a.href = url; a.download = `ais-backup-${ts}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
    finally { setBusy(null); }
  };

  // ── Save backup to server ─────────────────────────────────────────────────
  const saveBackup = async () => {
    setBusy("save");
    try {
      const res = await fetch(`${API}/api/backup/save`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: ORG }),
      });
      if (!res.ok) throw new Error();
      const { filename } = await res.json();
      toast.success(`Saved: ${filename}`);
      await fetchList();
    } catch { toast.error("Save failed"); }
    finally { setBusy(null); }
  };

  // ── Download a saved backup ───────────────────────────────────────────────
  const downloadBackup = async (filename: string) => {
    const res = await fetch(`${API}/api/backup/download/${filename}`, { headers: authHeaders() });
    if (!res.ok) { toast.error("Download failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Delete saved backup ───────────────────────────────────────────────────
  const deleteBackup = async (filename: string) => {
    if (!confirm(t.confirmDelete)) return;
    const res = await fetch(`${API}/api/backup/${filename}`, { method: "DELETE", headers: authHeaders() });
    if (res.ok) { await fetchList(); toast.success("Deleted"); }
    else toast.error("Delete failed");
  };

  // ── Restore from file ─────────────────────────────────────────────────────
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm(t.restoreWarning)) { e.target.value = ""; return; }
    setBusy("restore");
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      const res = await fetch(`${API}/api/backup/restore`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ backup }),
      });
      if (!res.ok) throw new Error();
      toast.success("Restore complete");
    } catch { toast.error("Restore failed — invalid file?"); }
    finally { setBusy(null); e.target.value = ""; }
  };

  // ── Export clients CSV ────────────────────────────────────────────────────
  const exportClients = async () => {
    setBusy("exportCsv");
    try {
      const res = await fetch(`${API}/api/crm/clients?orgId=${ORG}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const clients: Record<string, unknown>[] = await res.json();
      const headers = ["name", "email", "phone", "company", "status", "notes"];
      const rows = clients.map(c => headers.map(h => JSON.stringify((c[h] as string | null) ?? "")).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "clients.csv";
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
    finally { setBusy(null); }
  };

  // ── Export kanban CSV ─────────────────────────────────────────────────────
  const exportKanban = async () => {
    setBusy("exportKanban");
    try {
      const res = await fetch(`${API}/api/kanban?orgId=${ORG}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const cards: Record<string, unknown>[] = await res.json();
      const headers = ["title", "aircraft", "client", "priority", "column", "notes", "order"];
      const rows = cards.map(c => headers.map(h => JSON.stringify((c[h] as string | null) ?? "")).join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "kanban.csv";
      a.click(); URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
    finally { setBusy(null); }
  };

  // ── Import clients CSV ────────────────────────────────────────────────────
  const handleImportClients = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("importClients");
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const clients = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || [];
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || "").replace(/^"|"$/g, "").trim(); });
        return obj;
      });
      const res = await fetch(`${API}/api/backup/import/clients`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: ORG, clients }),
      });
      if (!res.ok) throw new Error();
      const { created, errors } = await res.json();
      toast.success(`Imported ${created} clients${errors > 0 ? `, ${errors} errors` : ""}`);
    } catch { toast.error("Import failed"); }
    finally { setBusy(null); e.target.value = ""; }
  };

  // ── Import kanban CSV ─────────────────────────────────────────────────────
  const handleImportKanban = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("importKanban");
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const cards = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || [];
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || "").replace(/^"|"$/g, "").trim(); });
        return obj;
      });
      const res = await fetch(`${API}/api/backup/import/kanban`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: ORG, cards }),
      });
      if (!res.ok) throw new Error();
      const { created, errors } = await res.json();
      toast.success(`Imported ${created} tasks${errors > 0 ? `, ${errors} errors` : ""}`);
    } catch { toast.error("Import failed"); }
    finally { setBusy(null); e.target.value = ""; }
  };

  // ── Save schedule config ──────────────────────────────────────────────────
  const saveSchedule = async () => {
    const res = await fetch(`${API}/api/backup/schedule`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ...schedule, orgId: ORG }),
    });
    if (res.ok) toast.success(t.saved);
    else toast.error("Failed to save schedule");
  };

  const fmt = (bytes: number) => bytes < 1024 ? `${bytes}B` : `${(bytes / 1024).toFixed(1)}KB`;

  return (
    <div style={{ maxWidth: "860px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: "0 0 6px" }}>
          {t.backup}
        </h1>
        <p style={{ color: "var(--steel)", fontSize: "13px", margin: 0 }}>{t.backupDesc}</p>
      </div>

      {/* ── Section: Full DB Backup ── */}
      <Section title="Database Backup">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <ActionBtn icon={<Download size={14} />} label={t.exportJson} loading={busy === "export"} onClick={exportJson} primary />
          <ActionBtn icon={<Save size={14} />} label={t.saving.replace("…", "")} loading={busy === "save"} onClick={saveBackup} />
          <label style={uploadLabel}>
            <RotateCcw size={14} />
            {t.restoreBackup}
            <input ref={restoreFileRef} type="file" accept=".json" hidden onChange={handleRestore} disabled={busy === "restore"} />
          </label>
        </div>
      </Section>

      {/* ── Section: CSV Export ── */}
      <Section title="CSV Export">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <ActionBtn icon={<Download size={14} />} label={t.exportClients} loading={busy === "exportCsv"} onClick={exportClients} />
          <ActionBtn icon={<Download size={14} />} label={t.exportKanban} loading={busy === "exportKanban"} onClick={exportKanban} />
        </div>
      </Section>

      {/* ── Section: CSV Import ── */}
      <Section title="CSV Import">
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <label style={uploadLabel}>
            <Upload size={14} />
            {busy === "importClients" ? "Importing…" : t.importClients}
            <input ref={clientFileRef} type="file" accept=".csv" hidden onChange={handleImportClients} disabled={!!busy} />
          </label>
          <label style={uploadLabel}>
            <Upload size={14} />
            {busy === "importKanban" ? "Importing…" : t.importKanban}
            <input ref={kanbanFileRef} type="file" accept=".csv" hidden onChange={handleImportKanban} disabled={!!busy} />
          </label>
        </div>
        <p style={{ color: "var(--steel)", fontSize: "11px", marginTop: "10px" }}>
          CSV must have headers: <code style={{ color: "var(--gold)" }}>name, email, phone, company, status, notes</code> (clients) or{" "}
          <code style={{ color: "var(--gold)" }}>title, aircraft, client, priority, column, notes, order</code> (tasks)
        </p>
      </Section>

      {/* ── Section: Schedule ── */}
      <Section title={t.scheduleBackup}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={e => setSchedule(s => ({ ...s, enabled: e.target.checked }))}
              style={{ accentColor: "var(--crimson)", width: "14px", height: "14px" }}
            />
            <span style={{ color: "var(--ivory-dim)", fontSize: "13px" }}>{t.enableSchedule}</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.15em", color: "var(--steel)", textTransform: "uppercase" }}>{t.frequency}</span>
            {(["hourly", "daily", "weekly"] as const).map(f => (
              <button
                key={f}
                onClick={() => setSchedule(s => ({ ...s, frequency: f }))}
                style={{
                  padding: "6px 16px", border: "none", cursor: "pointer",
                  fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
                  background: schedule.frequency === f ? "var(--crimson)" : "var(--surface-2)",
                  color: schedule.frequency === f ? "var(--ivory)" : "var(--steel)",
                  transition: "all 0.2s",
                }}
              >
                {t[f as keyof typeof t] as string || f}
              </button>
            ))}
            <button
              onClick={saveSchedule}
              style={{ marginLeft: "auto", padding: "6px 20px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
            >
              {t.save}
            </button>
          </div>
        </div>
      </Section>

      {/* ── Section: Saved Backups ── */}
      <Section title={t.savedBackups} action={
        <button onClick={fetchList} style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px" }}>
          <RefreshCw size={14} />
        </button>
      }>
        {loading && <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}
        {!loading && backups.length === 0 && (
          <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.noBackups}</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {backups.map(b => (
            <div key={b.filename} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "rgba(245,240,232,0.02)", border: "1px solid var(--border)" }}>
              <Clock size={12} color="var(--steel)" />
              <span style={{ fontSize: "12px", color: "var(--ivory-dim)", flex: 1, fontFamily: "monospace" }}>{b.filename}</span>
              <span style={{ fontSize: "11px", color: "var(--steel)" }}>{fmt(b.size)}</span>
              <span style={{ fontSize: "11px", color: "var(--steel)" }}>{new Date(b.createdAt).toLocaleString()}</span>
              <button
                onClick={() => downloadBackup(b.filename)}
                style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", padding: "4px", display: "flex" }}
                title="Download"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => deleteBackup(b.filename)}
                style={{ background: "none", border: "none", color: "var(--crimson)", cursor: "pointer", padding: "4px", display: "flex" }}
                title="Delete"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "28px", border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

function ActionBtn({ icon, label, loading, onClick, primary }: { icon: React.ReactNode; label: string; loading?: boolean; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: "7px",
        padding: "9px 18px", border: "none", cursor: loading ? "not-allowed" : "pointer",
        fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
        background: primary ? "var(--crimson)" : "rgba(245,240,232,0.06)",
        color: primary ? "var(--ivory)" : "var(--ivory-dim)",
        opacity: loading ? 0.6 : 1, transition: "opacity 0.2s",
      }}
    >
      {icon}
      {loading ? "…" : label}
    </button>
  );
}

const uploadLabel: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "7px",
  padding: "9px 18px",
  fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
  background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)",
  color: "var(--gold)", cursor: "pointer",
};
