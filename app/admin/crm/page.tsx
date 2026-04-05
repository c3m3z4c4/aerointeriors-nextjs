"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, ChevronRight, X, FileText, Trash2, Pencil, User } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type Client = {
  id: string; name: string; email?: string; phone?: string;
  company?: string; notes?: string; status: string;
  createdAt: string; _count?: { quotes: number };
  quotes?: Quote[];
};
type Quote = {
  id: string; title: string; amount?: number; currency: string;
  status: string; notes?: string; date: string; pdfPath?: string;
  client?: { id: string; name: string; company?: string };
};

const statusColors: Record<string, string> = {
  prospect: "var(--steel)", active: "var(--gold)", inactive: "#555",
  draft: "var(--steel)", sent: "var(--gold)", approved: "#4ade80", rejected: "var(--crimson)",
  scheduled: "var(--gold)", completed: "#4ade80", cancelled: "var(--crimson)",
};

function Badge({ s }: { s: string }) {
  return (
    <span style={{
      fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "2px 8px", border: `1px solid ${statusColors[s] || "var(--border)"}`,
      color: statusColors[s] || "var(--steel)", borderRadius: "2px",
    }}>{s}</span>
  );
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function CrmPage() {
  const { t } = useLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    const res = await fetch(`${API}/api/crm/clients?orgId=${ORG}`, { headers: authHeaders() });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  const fetchClient = useCallback(async (id: string) => {
    const res = await fetch(`${API}/api/crm/clients/${id}`, { headers: authHeaders() });
    if (res.ok) setSelected(await res.json());
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  async function saveClient(data: Partial<Client>) {
    const method = editingClient ? "PUT" : "POST";
    const url = editingClient ? `${API}/api/crm/clients/${editingClient.id}` : `${API}/api/crm/clients`;
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify({ orgId: ORG, ...data }) });
    if (res.ok) {
      await fetchClients();
      if (selected && editingClient?.id === selected.id) await fetchClient(selected.id);
      setShowClientForm(false); setEditingClient(null);
    }
  }

  async function deleteClient(id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await fetch(`${API}/api/crm/clients/${id}`, { method: "DELETE", headers: authHeaders() });
    setClients(c => c.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function saveQuote(data: Partial<Quote>) {
    const method = editingQuote ? "PUT" : "POST";
    const url = editingQuote ? `${API}/api/crm/quotes/${editingQuote.id}` : `${API}/api/crm/quotes`;
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify({ orgId: ORG, clientId: selected!.id, ...data }) });
    if (res.ok && selected) { await fetchClient(selected.id); setShowQuoteForm(false); setEditingQuote(null); }
  }

  async function deleteQuote(id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await fetch(`${API}/api/crm/quotes/${id}`, { method: "DELETE", headers: authHeaders() });
    if (selected) await fetchClient(selected.id);
  }

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%", overflow: "hidden" }}>
      {/* Left: Client List */}
      <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "13px", letterSpacing: "0.18em", color: "var(--ivory)", textTransform: "uppercase", margin: 0 }}>
            {t.admin.clients}
          </h2>
          <button onClick={() => { setEditingClient(null); setShowClientForm(true); }} style={btnStyle}>
            <Plus size={14} /> {t.admin.newClient}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
          {loading && <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}
          {!loading && clients.length === 0 && <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.admin.noClients}</p>}
          {clients.map(c => (
            <div key={c.id}
              onClick={() => fetchClient(c.id)}
              style={{
                padding: "12px 14px", cursor: "pointer", border: "1px solid",
                borderColor: selected?.id === c.id ? "var(--crimson)" : "var(--border)",
                background: selected?.id === c.id ? "rgba(187,35,25,0.06)" : "var(--surface)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.15s",
              }}>
              <div>
                <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500 }}>{c.name}</div>
                {c.company && <div style={{ fontSize: "11px", color: "var(--steel)", marginTop: "2px" }}>{c.company}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Badge s={c.status} />
                  <span style={{ fontSize: "10px", color: "var(--steel)" }}>{c._count?.quotes || 0} quotes</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button onClick={e => { e.stopPropagation(); setEditingClient(c); setShowClientForm(true); }} style={iconBtn}>
                  <Pencil size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteClient(c.id); }} style={{ ...iconBtn, color: "var(--crimson)" }}>
                  <Trash2 size={13} />
                </button>
                <ChevronRight size={14} style={{ color: "var(--steel)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Client Detail */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!selected ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--steel)", fontSize: "13px" }}>
            <User size={20} style={{ marginRight: "8px" }} /> Select a client
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Client info */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", color: "var(--ivory)", fontFamily: "var(--font-cormorant, serif)", fontStyle: "italic", margin: "0 0 4px" }}>
                    {selected.name}
                  </h3>
                  {selected.company && <div style={{ fontSize: "12px", color: "var(--gold)" }}>{selected.company}</div>}
                </div>
                <Badge s={selected.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {selected.email && <Info label="Email" value={selected.email} />}
                {selected.phone && <Info label={t.admin.phone} value={selected.phone} />}
              </div>
              {selected.notes && (
                <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255,255,255,0.03)", borderLeft: "2px solid var(--border)", fontSize: "13px", color: "var(--steel)" }}>
                  {selected.notes}
                </div>
              )}
            </div>

            {/* Quotes */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase", margin: 0 }}>
                  {t.admin.quotes}
                </h4>
                <button onClick={() => { setEditingQuote(null); setShowQuoteForm(true); }} style={btnStyle}>
                  <Plus size={13} /> {t.admin.newQuote}
                </button>
              </div>
              {(!selected.quotes || selected.quotes.length === 0) && (
                <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.admin.noQuotes}</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selected.quotes?.map(q => (
                  <div key={q.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500 }}>{q.title}</div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "6px", alignItems: "center" }}>
                        <Badge s={q.status} />
                        {q.amount != null && (
                          <span style={{ fontSize: "12px", color: "var(--gold)" }}>{q.currency} {q.amount.toLocaleString()}</span>
                        )}
                        <span style={{ fontSize: "11px", color: "var(--steel)" }}>{new Date(q.date).toLocaleDateString()}</span>
                      </div>
                      {q.notes && <div style={{ fontSize: "12px", color: "var(--steel)", marginTop: "4px" }}>{q.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {q.pdfPath && (
                        <a href={`${API}${q.pdfPath}`} target="_blank" style={iconBtn}><FileText size={13} /></a>
                      )}
                      <button onClick={() => { setEditingQuote(q); setShowQuoteForm(true); }} style={iconBtn}><Pencil size={13} /></button>
                      <button onClick={() => deleteQuote(q.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showClientForm && (
        <Modal title={editingClient ? t.admin.edit : t.admin.newClient} onClose={() => { setShowClientForm(false); setEditingClient(null); }}>
          <ClientForm initial={editingClient} onSave={saveClient} onCancel={() => { setShowClientForm(false); setEditingClient(null); }} t={t.admin} />
        </Modal>
      )}

      {/* Quote Form Modal */}
      {showQuoteForm && selected && (
        <Modal title={editingQuote ? t.admin.edit : t.admin.newQuote} onClose={() => { setShowQuoteForm(false); setEditingQuote(null); }}>
          <QuoteForm initial={editingQuote} onSave={saveQuote} onCancel={() => { setShowQuoteForm(false); setEditingQuote(null); }} t={t.admin} />
        </Modal>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "9.5px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--ivory)" }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function ClientForm({ initial, onSave, onCancel, t }: { initial: Client | null; onSave: (d: Partial<Client>) => void; onCancel: () => void; t: Record<string, string> }) {
  const [form, setForm] = useState({ name: initial?.name || "", email: initial?.email || "", phone: initial?.phone || "", company: initial?.company || "", notes: initial?.notes || "", status: initial?.status || "prospect" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label={t.name} required><input value={form.name} onChange={set("name")} className="field" required /></Field>
      <Field label={t.email}><input type="email" value={form.email} onChange={set("email")} className="field" /></Field>
      <Field label={t.phone}><input value={form.phone} onChange={set("phone")} className="field" /></Field>
      <Field label={t.company}><input value={form.company} onChange={set("company")} className="field" /></Field>
      <Field label={t.status}>
        <select value={form.status} onChange={set("status")} className="field">
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </Field>
      <Field label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={3} /></Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={secondaryBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

function QuoteForm({ initial, onSave, onCancel, t }: { initial: Quote | null; onSave: (d: Partial<Quote>) => void; onCancel: () => void; t: Record<string, string> }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    amount: initial?.amount?.toString() || "",
    currency: initial?.currency || "USD",
    status: initial?.status || "draft",
    notes: initial?.notes || "",
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: form.amount ? parseFloat(form.amount) : undefined }); }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Field label={t.name} required><input value={form.title} onChange={set("title")} className="field" required /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label={t.amount}><input type="number" step="0.01" value={form.amount} onChange={set("amount")} className="field" /></Field>
        <Field label={t.currency}>
          <select value={form.currency} onChange={set("currency")} className="field">
            {["USD", "EUR", "MXN", "CAD", "GBP"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label={t.status}>
          <select value={form.status} onChange={set("status")} className="field">
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
        <Field label={t.date}><input type="date" value={form.date} onChange={set("date")} className="field" /></Field>
      </div>
      <Field label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={3} /></Field>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={secondaryBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}

const btnStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: "var(--ivory)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secondaryBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer" };
