"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, ChevronRight, X, FileText, Trash2, Pencil, User, Download } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type Client = {
  id: string; name: string; email?: string; phone?: string;
  company?: string; address?: string; city?: string; state?: string; zip?: string;
  notes?: string; status: string;
  createdAt: string; _count?: { quotes: number };
  quotes?: Quote[];
};

type LineItem = { service: string; description: string; qty: number; unitPrice: number; total: number };

type Quote = {
  id: string; quoteNumber?: string; title: string;
  aircraftMake?: string; aircraftModel?: string; aircraftYear?: number; tailNumber?: string;
  description?: string; lineItems?: string;
  estimatedStart?: string; estimatedEnd?: string; location?: string;
  subtotal?: number; taxRate?: number; taxAmount?: number; discount?: number;
  total?: number; depositRequired?: number;
  currency: string; paymentTerms?: string;
  status: string; validUntil?: string; terms?: string; notes?: string;
  pdfPath?: string; date: string;
  client?: { id: string; name: string; company?: string };
};

const statusColors: Record<string, string> = {
  prospect: "var(--steel)", active: "var(--gold)", inactive: "#555",
  draft: "var(--steel)", sent: "var(--gold)", approved: "#4ade80",
  rejected: "var(--crimson)", expired: "#888",
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

  async function downloadQuotePdf(id: string) {
    try {
      const res = await fetch(`${API}/api/crm/quotes/${id}/pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { toast.error(`PDF error: ${res.status}`); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const q = selected?.quotes?.find(x => x.id === id);
      const a = document.createElement("a");
      a.href = url; a.download = `${q?.quoteNumber || id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
      if (selected) await fetchClient(selected.id);
    } catch { toast.error("PDF download failed"); }
  }

  return (
    <div style={{ display: "flex", gap: "24px", height: "100%", overflow: "hidden" }}>
      {/* Left: Client List */}
      <div style={{ width: "300px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
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
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Badge s={selected.status} />
                  <button onClick={() => { setEditingClient(selected); setShowClientForm(true); }} style={iconBtn}>
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {selected.email && <Info label="Email" value={selected.email} />}
                {selected.phone && <Info label={t.admin.phone} value={selected.phone} />}
                {selected.address && <Info label={t.admin.address} value={[selected.address, selected.city, selected.state, selected.zip].filter(Boolean).join(", ")} />}
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
                  <div key={q.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500 }}>
                          {q.quoteNumber && <span style={{ color: "var(--gold)", fontSize: "11px", marginRight: "8px" }}>{q.quoteNumber}</span>}
                          {q.title}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px", alignItems: "center" }}>
                          <Badge s={q.status} />
                          {q.total != null && (
                            <span style={{ fontSize: "12px", color: "var(--gold)", fontWeight: 600 }}>
                              {q.currency} {q.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                          {q.aircraftMake && (
                            <span style={{ fontSize: "11px", color: "var(--steel)" }}>
                              {[q.aircraftMake, q.aircraftModel].filter(Boolean).join(" ")}
                              {q.tailNumber ? ` · ${q.tailNumber}` : ""}
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: "var(--steel)" }}>{new Date(q.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", marginLeft: "12px" }}>
                        <button onClick={() => downloadQuotePdf(q.id)} style={iconBtn} title={t.admin.generatePdf}>
                          <Download size={13} color="var(--gold)" />
                        </button>
                        {q.pdfPath && (
                          <a href={`${API}${q.pdfPath}`} target="_blank" style={iconBtn}><FileText size={13} /></a>
                        )}
                        <button onClick={() => { setEditingQuote(q); setShowQuoteForm(true); }} style={iconBtn}><Pencil size={13} /></button>
                        <button onClick={() => deleteQuote(q.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showClientForm && (
        <Modal title={editingClient ? t.admin.edit : t.admin.newClient} onClose={() => { setShowClientForm(false); setEditingClient(null); }}>
          <ClientForm initial={editingClient} onSave={saveClient} onCancel={() => { setShowClientForm(false); setEditingClient(null); }} />
        </Modal>
      )}

      {showQuoteForm && selected && (
        <Modal title={editingQuote ? t.admin.edit : t.admin.newQuote} onClose={() => { setShowQuoteForm(false); setEditingQuote(null); }} wide>
          <QuoteForm initial={editingQuote} onSave={saveQuote} onCancel={() => { setShowQuoteForm(false); setEditingQuote(null); }} />
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "9.5px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px", color: "var(--ivory)" }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: wide ? "780px" : "500px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

function ClientForm({ initial, onSave, onCancel }: { initial: Client | null; onSave: (d: Partial<Client>) => void; onCancel: () => void }) {
  const { t: { admin: t } } = useLang();
  const [form, setForm] = useState({
    name: initial?.name || "", email: initial?.email || "", phone: initial?.phone || "",
    company: initial?.company || "", address: initial?.address || "",
    city: initial?.city || "", state: initial?.state || "", zip: initial?.zip || "",
    notes: initial?.notes || "", status: initial?.status || "prospect",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label={t.name} required><input value={form.name} onChange={set("name")} className="field" required /></Field>
        <Field label={t.company}><input value={form.company} onChange={set("company")} className="field" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label="Email"><input type="email" value={form.email} onChange={set("email")} className="field" /></Field>
        <Field label={t.phone}>
          <input value={form.phone} onChange={set("phone")} className="field" placeholder="+1 555 123 4567" />
          <span style={{ fontSize: "10px", color: "var(--steel)", marginTop: "3px", display: "block" }}>Include country code</span>
        </Field>
      </div>
      <Field label={t.address}><input value={form.address} onChange={set("address")} className="field" /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label={t.city}><input value={form.city} onChange={set("city")} className="field" /></Field>
        <Field label={t.state}><input value={form.state} onChange={set("state")} className="field" /></Field>
        <Field label={t.zip}><input value={form.zip} onChange={set("zip")} className="field" /></Field>
      </div>
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

function QuoteForm({ initial, onSave, onCancel }: { initial: Quote | null; onSave: (d: Partial<Quote>) => void; onCancel: () => void }) {
  const { t: { admin: t } } = useLang();

  const parseItems = (s?: string): LineItem[] => {
    try { return JSON.parse(s || "[]"); } catch { return []; }
  };

  const [form, setForm] = useState({
    quoteNumber: initial?.quoteNumber || "",
    title: initial?.title || "",
    aircraftMake: initial?.aircraftMake || "",
    aircraftModel: initial?.aircraftModel || "",
    aircraftYear: initial?.aircraftYear?.toString() || "",
    tailNumber: initial?.tailNumber || "",
    description: initial?.description || "",
    estimatedStart: initial?.estimatedStart ? new Date(initial.estimatedStart).toISOString().slice(0, 10) : "",
    estimatedEnd: initial?.estimatedEnd ? new Date(initial.estimatedEnd).toISOString().slice(0, 10) : "",
    location: initial?.location || "",
    subtotal: initial?.subtotal?.toString() || "",
    taxRate: initial?.taxRate?.toString() || "",
    taxAmount: initial?.taxAmount?.toString() || "",
    discount: initial?.discount?.toString() || "",
    total: initial?.total?.toString() || "",
    depositRequired: initial?.depositRequired?.toString() || "",
    currency: initial?.currency || "USD",
    paymentTerms: initial?.paymentTerms || "Net 30",
    status: initial?.status || "draft",
    validUntil: initial?.validUntil ? new Date(initial.validUntil).toISOString().slice(0, 10) : "",
    terms: initial?.terms || "",
    notes: initial?.notes || "",
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  const [items, setItems] = useState<LineItem[]>(parseItems(initial?.lineItems));

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const recalc = (newItems: LineItem[]) => {
    const subtotal = newItems.reduce((s, i) => s + (i.total || 0), 0);
    const taxRate = parseFloat(form.taxRate) || 0;
    const discount = parseFloat(form.discount) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    setForm(f => ({
      ...f,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    }));
  };

  const updateItem = (i: number, k: keyof LineItem, v: string) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[i] };
      if (k === "qty" || k === "unitPrice") {
        (item as Record<string, number | string>)[k] = parseFloat(v) || 0;
        item.total = (k === "qty" ? (parseFloat(v) || 0) : item.qty) * (k === "unitPrice" ? (parseFloat(v) || 0) : item.unitPrice);
      } else {
        (item as Record<string, number | string>)[k] = v;
      }
      next[i] = item;
      recalc(next);
      return next;
    });
  };

  const addItem = () => setItems(p => [...p, { service: "", description: "", qty: 1, unitPrice: 0, total: 0 }]);
  const removeItem = (i: number) => setItems(p => { const n = p.filter((_, j) => j !== i); recalc(n); return n; });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toNum = (s: string) => s ? parseFloat(s) : undefined;
    onSave({
      ...form,
      aircraftYear: form.aircraftYear ? parseInt(form.aircraftYear) : undefined,
      subtotal: toNum(form.subtotal),
      taxRate: toNum(form.taxRate),
      taxAmount: toNum(form.taxAmount),
      discount: toNum(form.discount),
      total: toNum(form.total),
      depositRequired: toNum(form.depositRequired),
      lineItems: JSON.stringify(items),
      estimatedStart: form.estimatedStart || undefined,
      estimatedEnd: form.estimatedEnd || undefined,
      validUntil: form.validUntil || undefined,
    });
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", marginBottom: "2px", marginTop: "4px", paddingBottom: "6px", borderBottom: "1px solid var(--border)" }}>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>General</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label={t.quoteNumber}><input value={form.quoteNumber} onChange={set("quoteNumber")} className="field" placeholder="Auto" /></Field>
        <Field label={t.date}><input type="date" value={form.date} onChange={set("date")} className="field" /></Field>
        <Field label={t.status}>
          <select value={form.status} onChange={set("status")} className="field">
            {["draft","sent","approved","rejected","expired"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label={`${t.title} *`} required>
        <input value={form.title} onChange={set("title")} className="field" required placeholder="e.g. Full Interior Refurbishment – Gulfstream G550" />
      </Field>

      <SectionTitle>{t.aircraftMake} / Aircraft</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
        <Field label={t.aircraftMake}><input value={form.aircraftMake} onChange={set("aircraftMake")} className="field" placeholder="Gulfstream" /></Field>
        <Field label={t.aircraftModel}><input value={form.aircraftModel} onChange={set("aircraftModel")} className="field" placeholder="G550" /></Field>
        <Field label={t.aircraftYear}><input type="number" value={form.aircraftYear} onChange={set("aircraftYear")} className="field" placeholder="2015" /></Field>
        <Field label={t.tailNumber}><input value={form.tailNumber} onChange={set("tailNumber")} className="field" placeholder="N12345" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <Field label={t.location}><input value={form.location} onChange={set("location")} className="field" placeholder="Hangar A, Los Angeles" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field label={t.estimatedStart}><input type="date" value={form.estimatedStart} onChange={set("estimatedStart")} className="field" /></Field>
          <Field label={t.estimatedEnd}><input type="date" value={form.estimatedEnd} onChange={set("estimatedEnd")} className="field" /></Field>
        </div>
      </div>

      <SectionTitle>{t.projectDescription}</SectionTitle>
      <Field label={t.projectDescription}>
        <textarea value={form.description} onChange={set("description")} className="field" rows={3} placeholder="Describe the full scope of the project, client requirements and goals..." />
      </Field>

      <SectionTitle>{t.scopeOfWork}</SectionTitle>
      {items.map((item, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 0.8fr 1fr 1fr 32px", gap: "8px", alignItems: "end" }}>
          <Field label={i === 0 ? t.service : undefined}>
            <input value={item.service} onChange={e => updateItem(i, "service", e.target.value)} className="field" placeholder="Service / Item" />
          </Field>
          <Field label={i === 0 ? "Description" : undefined}>
            <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="field" placeholder="Details" />
          </Field>
          <Field label={i === 0 ? t.qty : undefined}>
            <input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} className="field" min="0" step="0.5" />
          </Field>
          <Field label={i === 0 ? t.unitPrice : undefined}>
            <input type="number" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} className="field" step="0.01" min="0" />
          </Field>
          <Field label={i === 0 ? "Total" : undefined}>
            <input type="number" value={item.total.toFixed(2)} readOnly className="field" style={{ color: "var(--gold)" }} />
          </Field>
          <button type="button" onClick={() => removeItem(i)} style={{ ...iconBtn, color: "var(--crimson)", marginBottom: "4px" }}><X size={14} /></button>
        </div>
      ))}
      <button type="button" onClick={addItem} style={secondaryBtn}>
        + {t.addLineItem}
      </button>

      <SectionTitle>Financial Summary</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
        <Field label={t.currency}>
          <select value={form.currency} onChange={set("currency")} className="field">
            {["USD","EUR","MXN","CAD","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t.subtotal}><input type="number" step="0.01" min="0" value={form.subtotal} onChange={set("subtotal")} className="field" /></Field>
        <Field label={t.taxRate + " (%)"}><input type="number" step="0.01" min="0" value={form.taxRate} onChange={set("taxRate")} className="field" placeholder="8.5" /></Field>
        <Field label={t.discount}><input type="number" step="0.01" min="0" value={form.discount} onChange={set("discount")} className="field" /></Field>
        <Field label={t.total}>
          <input type="number" step="0.01" min="0" value={form.total} onChange={set("total")} className="field" style={{ color: "var(--gold)", fontWeight: 600 }} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <Field label={t.depositRequired}><input type="number" step="0.01" min="0" value={form.depositRequired} onChange={set("depositRequired")} className="field" /></Field>
        <Field label={t.paymentTerms}>
          <select value={form.paymentTerms} onChange={set("paymentTerms")} className="field">
            {["Net 15","Net 30","Net 45","Net 60","Due on Delivery","50% Deposit / 50% on Completion"].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label={t.validUntil}><input type="date" value={form.validUntil} onChange={set("validUntil")} className="field" /></Field>
      </div>

      <SectionTitle>Notes & Terms</SectionTitle>
      <Field label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={2} /></Field>
      <Field label={t.terms}>
        <textarea value={form.terms} onChange={set("terms")} className="field" rows={2} placeholder="This quote is valid for 30 days from the date issued…" />
      </Field>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "8px" }}>
        <button type="button" onClick={onCancel} style={secondaryBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label?: string; required?: boolean; children: React.ReactNode }) {
  if (!label) return <div>{children}</div>;
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
const secondaryBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer", letterSpacing: "0.08em" };
