"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, X, FileText, Trash2, Pencil, Download, ChevronDown, ChevronUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG  = process.env.NEXT_PUBLIC_ORG_ID  || "";

type Client = { id: string; name: string; company?: string; email?: string; phone?: string; address?: string; city?: string; state?: string; zip?: string };
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
  draft: "var(--steel)", sent: "var(--gold)", approved: "#4ade80",
  rejected: "var(--crimson)", expired: "#888",
};

function Badge({ s }: { s: string }) {
  return (
    <span style={{
      fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "3px 10px", border: `1px solid ${statusColors[s] || "var(--border)"}`,
      color: statusColors[s] || "var(--steel)",
    }}>{s}</span>
  );
}

function authH(json = false) {
  return { ...(json ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${getToken()}` };
}

export default function QuotesPage() {
  const { t: { admin: t } } = useLang();
  const [quotes,  setQuotes]  = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [qr, cr] = await Promise.all([
      fetch(`${API}/api/crm/quotes?orgId=${ORG}`, { headers: authH(true) }),
      fetch(`${API}/api/crm/clients?orgId=${ORG}`, { headers: authH(true) }),
    ]);
    if (qr.ok) setQuotes(await qr.json());
    if (cr.ok) setClients(await cr.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(clientId: string, data: Partial<Quote>) {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API}/api/crm/quotes/${editing.id}` : `${API}/api/crm/quotes`;
    const res = await fetch(url, { method, headers: authH(true), body: JSON.stringify({ orgId: ORG, clientId, ...data }) });
    if (res.ok) { await load(); setShowForm(false); setEditing(null); }
  }

  async function del(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`${API}/api/crm/quotes/${id}`, { method: "DELETE", headers: authH() });
    setQuotes(p => p.filter(q => q.id !== id));
  }

  async function downloadPdf(q: Quote) {
    try {
      const res = await fetch(`${API}/api/crm/quotes/${q.id}/pdf`, { method: "POST", headers: authH() });
      if (!res.ok) { toast.error(`PDF error: ${res.status}`); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${q.quoteNumber || q.id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
      await load();
    } catch (e) { toast.error("PDF download failed"); }
  }

  const visible = filter === "all" ? quotes : quotes.filter(q => q.status === filter);

  const stats = {
    total: quotes.length,
    approved: quotes.filter(q => q.status === "approved").length,
    pending: quotes.filter(q => ["draft","sent"].includes(q.status)).length,
    value: quotes.filter(q => q.status === "approved").reduce((s, q) => s + (q.total || 0), 0),
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: 0 }}>
          {t.quotes}
        </h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-crimson">
          <Plus size={14} /> {t.newQuote}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Quotes",  val: stats.total,   fmt: "num", color: "var(--ivory)" },
          { label: "Approved",      val: stats.approved, fmt: "num", color: "#4ade80" },
          { label: "Pending",       val: stats.pending,  fmt: "num", color: "var(--gold)" },
          { label: "Approved Value",val: stats.value,    fmt: "usd", color: "var(--gold)" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 20px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase", marginBottom: "6px" }}>{c.label}</div>
            <div style={{ fontSize: "22px", fontFamily: "var(--font-cormorant, serif)", color: c.color, fontStyle: "italic" }}>
              {c.fmt === "usd" ? `$${(c.val as number).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : c.val}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all","draft","sent","approved","rejected","expired"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", border: "none", cursor: "pointer",
            fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
            background: filter === f ? "var(--crimson)" : "var(--surface)",
            color: filter === f ? "var(--ivory)" : "var(--steel)",
          }}>{f}</button>
        ))}
      </div>

      {/* List */}
      {loading && <p style={{ color: "var(--steel)" }}>Loading…</p>}
      {!loading && visible.length === 0 && <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.noQuotes}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {visible.map(q => (
          <QuoteRow
            key={q.id}
            q={q}
            onEdit={() => { setEditing(q); setShowForm(true); }}
            onDelete={() => del(q.id)}
            onPdf={() => downloadPdf(q)}
            apiBase={API}
          />
        ))}
      </div>

      {showForm && (
        <QuoteModal
          initial={editing}
          clients={clients}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ── Quote Row ─────────────────────────────────────────────────────────────────

function QuoteRow({ q, onEdit, onDelete, onPdf, apiBase }: {
  q: Quote; onEdit: () => void; onDelete: () => void; onPdf: () => void; apiBase: string;
}) {
  const [open, setOpen] = useState(false);
  const items: LineItem[] = (() => { try { return JSON.parse(q.lineItems || "[]"); } catch { return []; } })();

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Summary row */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {q.quoteNumber && (
              <span style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.1em" }}>{q.quoteNumber}</span>
            )}
            <span style={{ fontSize: "14px", color: "var(--ivory)", fontWeight: 500 }}>{q.title}</span>
            <Badge s={q.status} />
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "5px", flexWrap: "wrap" }}>
            {q.client && <span style={{ fontSize: "12px", color: "var(--steel)" }}>{q.client.name}{q.client.company ? ` — ${q.client.company}` : ""}</span>}
            {q.aircraftMake && (
              <span style={{ fontSize: "12px", color: "var(--steel)" }}>
                {[q.aircraftMake, q.aircraftModel].filter(Boolean).join(" ")}
                {q.tailNumber ? ` · ${q.tailNumber}` : ""}
              </span>
            )}
            {q.total != null && (
              <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
                {q.currency} {q.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            )}
            <span style={{ fontSize: "11px", color: "var(--steel)" }}>{new Date(q.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
          <button onClick={onPdf} style={{ ...iconBtn, color: "var(--gold)" }} title="Generate PDF"><Download size={14} /></button>
          {q.pdfPath && <a href={`${apiBase}${q.pdfPath}`} target="_blank" style={iconBtn}><FileText size={14} /></a>}
          <button onClick={onEdit} style={iconBtn}><Pencil size={14} /></button>
          <button onClick={onDelete} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={14} /></button>
          <button onClick={() => setOpen(o => !o)} style={iconBtn}>
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {q.description && (
            <p style={{ fontSize: "13px", color: "var(--ivory-dim)", lineHeight: 1.6, margin: 0 }}>{q.description}</p>
          )}
          {items.length > 0 && (
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", marginBottom: "8px" }}>Scope of Work</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "rgba(245,240,232,0.04)" }}>
                    {["Service","Description","Qty","Unit Price","Total"].map(h => (
                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: "9px", letterSpacing: "0.15em", color: "var(--steel)", textTransform: "uppercase", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 10px", color: "var(--ivory)" }}>{item.service}</td>
                      <td style={{ padding: "8px 10px", color: "var(--steel)" }}>{item.description}</td>
                      <td style={{ padding: "8px 10px", color: "var(--ivory-dim)" }}>{item.qty}</td>
                      <td style={{ padding: "8px 10px", color: "var(--ivory-dim)" }}>${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "8px 10px", color: "var(--gold)", fontWeight: 600 }}>${item.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "24px" }}>
            {q.subtotal != null && <div style={{ textAlign: "right" }}><div style={labelStyle}>Subtotal</div><div style={{ color: "var(--ivory)", fontSize: "13px" }}>{q.currency} {q.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
            {q.discount != null && q.discount > 0 && <div style={{ textAlign: "right" }}><div style={labelStyle}>Discount</div><div style={{ color: "var(--steel)", fontSize: "13px" }}>– {q.currency} {q.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
            {q.taxAmount != null && q.taxAmount > 0 && <div style={{ textAlign: "right" }}><div style={labelStyle}>Tax ({q.taxRate}%)</div><div style={{ color: "var(--ivory)", fontSize: "13px" }}>{q.currency} {q.taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
            {q.total != null && <div style={{ textAlign: "right", padding: "6px 12px", background: "rgba(187,35,25,0.1)", border: "1px solid rgba(187,35,25,0.3)" }}><div style={labelStyle}>Total</div><div style={{ color: "var(--crimson)", fontSize: "16px", fontWeight: 700 }}>{q.currency} {q.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div></div>}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: "9px", letterSpacing: "0.15em", color: "var(--steel)", textTransform: "uppercase", marginBottom: "4px" };

// ── Quote Modal ───────────────────────────────────────────────────────────────

function QuoteModal({ initial, clients, onSave, onClose }: {
  initial: Quote | null;
  clients: Client[];
  onSave: (clientId: string, data: Partial<Quote>) => void;
  onClose: () => void;
}) {
  const { t: { admin: t } } = useLang();
  const parseItems = (s?: string): LineItem[] => { try { return JSON.parse(s || "[]"); } catch { return []; } };

  const [clientId, setClientId] = useState(initial?.client?.id || "");
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
    const taxRate  = parseFloat(form.taxRate) || 0;
    const discount = parseFloat(form.discount) || 0;
    const taxAmt   = (subtotal - discount) * (taxRate / 100);
    setForm(f => ({ ...f, subtotal: subtotal.toFixed(2), taxAmount: taxAmt.toFixed(2), total: (subtotal - discount + taxAmt).toFixed(2) }));
  };

  const updateItem = (i: number, k: keyof LineItem, v: string) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[i] };
      if (k === "qty" || k === "unitPrice") {
        (item as Record<string, number | string>)[k] = parseFloat(v) || 0;
        item.total = (k === "qty" ? parseFloat(v) || 0 : item.qty) * (k === "unitPrice" ? parseFloat(v) || 0 : item.unitPrice);
      } else {
        (item as Record<string, number | string>)[k] = v;
      }
      next[i] = item;
      recalc(next);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = (s: string) => s ? parseFloat(s) : undefined;
    onSave(clientId, {
      ...form,
      aircraftYear: form.aircraftYear ? parseInt(form.aircraftYear) : undefined,
      subtotal: n(form.subtotal), taxRate: n(form.taxRate), taxAmount: n(form.taxAmount),
      discount: n(form.discount), total: n(form.total), depositRequired: n(form.depositRequired),
      lineItems: JSON.stringify(items),
      estimatedStart: form.estimatedStart || undefined,
      estimatedEnd: form.estimatedEnd || undefined,
      validUntil: form.validUntil || undefined,
    });
  };

  const ST = ({ label }: { label: string }) => (
    <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", paddingBottom: "6px", borderBottom: "1px solid var(--border)", marginTop: "4px" }}>{label}</div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "820px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>
            {initial ? t.edit : t.newQuote}
          </span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <ST label="Client & General" />
          <Field label={`${t.client} *`}>
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="field" required>
              <option value="">— {t.client} —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.quoteNumber}><input value={form.quoteNumber} onChange={set("quoteNumber")} className="field" placeholder="Auto" /></Field>
            <Field label={t.date}><input type="date" value={form.date} onChange={set("date")} className="field" /></Field>
            <Field label={t.status}>
              <select value={form.status} onChange={set("status")} className="field">
                {["draft","sent","approved","rejected","expired"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label={`${t.title} *`}>
            <input value={form.title} onChange={set("title")} className="field" required placeholder="e.g. Full Interior Refurbishment — Gulfstream G550" />
          </Field>

          <ST label="Aircraft" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.aircraftMake}><input value={form.aircraftMake} onChange={set("aircraftMake")} className="field" placeholder="Gulfstream" /></Field>
            <Field label={t.aircraftModel}><input value={form.aircraftModel} onChange={set("aircraftModel")} className="field" placeholder="G550" /></Field>
            <Field label={t.aircraftYear}><input type="number" value={form.aircraftYear} onChange={set("aircraftYear")} className="field" placeholder="2015" /></Field>
            <Field label={t.tailNumber}><input value={form.tailNumber} onChange={set("tailNumber")} className="field" placeholder="N12345" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.location}><input value={form.location} onChange={set("location")} className="field" /></Field>
            <Field label={t.estimatedStart}><input type="date" value={form.estimatedStart} onChange={set("estimatedStart")} className="field" /></Field>
            <Field label={t.estimatedEnd}><input type="date" value={form.estimatedEnd} onChange={set("estimatedEnd")} className="field" /></Field>
          </div>

          <ST label={t.projectDescription} />
          <Field label={t.projectDescription}>
            <textarea value={form.description} onChange={set("description")} className="field" rows={3} placeholder="Describe the project scope, requirements and goals…" />
          </Field>

          <ST label={t.scopeOfWork} />
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.2fr 0.6fr 1fr 1fr 32px", gap: "8px", alignItems: "end" }}>
              <Field label={i === 0 ? t.service : undefined}><input value={item.service} onChange={e => updateItem(i, "service", e.target.value)} className="field" placeholder="Service" /></Field>
              <Field label={i === 0 ? "Description" : undefined}><input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="field" /></Field>
              <Field label={i === 0 ? t.qty : undefined}><input type="number" value={item.qty} onChange={e => updateItem(i, "qty", e.target.value)} className="field" min="0" step="0.5" /></Field>
              <Field label={i === 0 ? t.unitPrice : undefined}><input type="number" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", e.target.value)} className="field" step="0.01" min="0" /></Field>
              <Field label={i === 0 ? "Total" : undefined}><input type="number" value={item.total.toFixed(2)} readOnly className="field" style={{ color: "var(--gold)" }} /></Field>
              <button type="button" onClick={() => { const n = items.filter((_, j) => j !== i); setItems(n); recalc(n); }} style={{ ...iconBtn, color: "var(--crimson)", marginBottom: "4px" }}><X size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems(p => [...p, { service: "", description: "", qty: 1, unitPrice: 0, total: 0 }])} style={secondaryBtn}>
            + {t.addLineItem}
          </button>

          <ST label="Financial Summary" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.currency}><select value={form.currency} onChange={set("currency")} className="field">{["USD","EUR","MXN","CAD","GBP"].map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label={t.subtotal}><input type="number" step="0.01" min="0" value={form.subtotal} onChange={set("subtotal")} className="field" /></Field>
            <Field label={`${t.taxRate} (%)`}><input type="number" step="0.01" min="0" value={form.taxRate} onChange={set("taxRate")} className="field" placeholder="8.5" /></Field>
            <Field label={t.discount}><input type="number" step="0.01" min="0" value={form.discount} onChange={set("discount")} className="field" /></Field>
            <Field label={t.total}><input type="number" step="0.01" min="0" value={form.total} onChange={set("total")} className="field" style={{ color: "var(--gold)", fontWeight: 600 }} /></Field>
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

          <ST label="Notes & Terms" />
          <Field label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={2} /></Field>
          <Field label={t.terms}><textarea value={form.terms} onChange={set("terms")} className="field" rows={2} placeholder="This quote is valid for 30 days from the date issued…" /></Field>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "8px" }}>
            <button type="button" onClick={onClose} style={secondaryBtn}>{t.cancel}</button>
            <button type="submit" className="btn-crimson">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label?: string; children: React.ReactNode }) {
  if (!label) return <div>{children}</div>;
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{label}</label>
      {children}
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secondaryBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer", letterSpacing: "0.08em" };
