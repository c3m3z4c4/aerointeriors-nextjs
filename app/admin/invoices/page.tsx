"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, X, FileText, Trash2, Pencil, Download } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type Client = { id: string; name: string; company?: string; email?: string; phone?: string; address?: string; city?: string; state?: string; zip?: string };
type Quote = { id: string; quoteNumber?: string; title: string };
type LineItem = { description: string; qty: number; unitPrice: number; total: number };

type Invoice = {
  id: string; invoiceNumber?: string;
  clientId: string; client?: Client;
  quoteId?: string; quote?: { id: string; quoteNumber?: string; title: string };
  billToName: string; billToCompany?: string;
  billToAddress?: string; billToCity?: string; billToState?: string; billToZip?: string;
  billToEmail?: string; billToPhone?: string;
  lineItems?: string;
  subtotal?: number; taxRate?: number; taxAmount?: number; discount?: number;
  total?: number; amountPaid?: number;
  currency: string; paymentTerms?: string; paymentMethod?: string; paymentNotes?: string;
  issueDate: string; dueDate?: string; paidDate?: string;
  status: string; poNumber?: string; notes?: string; terms?: string; pdfPath?: string;
};

const statusColors: Record<string, string> = {
  draft: "var(--steel)", sent: "var(--gold)", paid: "#4ade80",
  overdue: "var(--crimson)", cancelled: "#555",
};

function Badge({ s }: { s: string }) {
  return (
    <span style={{
      fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
      padding: "3px 10px", border: `1px solid ${statusColors[s] || "var(--border)"}`,
      color: statusColors[s] || "var(--steel)", borderRadius: "2px",
    }}>{s}</span>
  );
}

function authH(json = false) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function InvoicesPage() {
  const { t: { admin: t } } = useLang();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, cliRes, quotRes] = await Promise.all([
      fetch(`${API}/api/invoices?orgId=${ORG}`, { headers: authH() }),
      fetch(`${API}/api/crm/clients?orgId=${ORG}`, { headers: authH(true) }),
      fetch(`${API}/api/crm/quotes?orgId=${ORG}`, { headers: authH(true) }),
    ]);
    if (invRes.ok)  setInvoices(await invRes.json());
    if (cliRes.ok)  setClients(await cliRes.json());
    if (quotRes.ok) setQuotes(await quotRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(data: Partial<Invoice>) {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API}/api/invoices/${editing.id}` : `${API}/api/invoices`;
    const res = await fetch(url, { method, headers: authH(true), body: JSON.stringify({ orgId: ORG, ...data }) });
    if (res.ok) { await load(); setShowForm(false); setEditing(null); }
  }

  async function del(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`${API}/api/invoices/${id}`, { method: "DELETE", headers: authH() });
    setInvoices(p => p.filter(i => i.id !== id));
  }

  async function downloadPdf(id: string) {
    try {
      const res = await fetch(`${API}/api/invoices/${id}/pdf`, { method: "POST", headers: authH() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(`PDF error ${res.status}: ${body.error || "unknown"}`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const inv = invoices.find(i => i.id === id);
      const a = document.createElement("a");
      a.href = url; a.download = `${inv?.invoiceNumber || id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
      await load();
    } catch { toast.error("PDF download failed"); }
  }

  const visible = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
  const totals = { total: invoices.reduce((s, i) => s + (i.total || 0), 0), paid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0), outstanding: invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((s, i) => s + ((i.total || 0) - (i.amountPaid || 0)), 0) };

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: "0 0 4px" }}>
            {t.invoices}
          </h1>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-crimson">
          <Plus size={14} /> {t.newInvoice}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total Invoiced", val: totals.total, color: "var(--ivory)" },
          { label: "Collected", val: totals.paid, color: "#4ade80" },
          { label: "Outstanding", val: totals.outstanding, color: "var(--gold)" },
        ].map(card => (
          <div key={card.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 20px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase", marginBottom: "6px" }}>{card.label}</div>
            <div style={{ fontSize: "22px", fontFamily: "var(--font-cormorant, serif)", color: card.color, fontStyle: "italic" }}>
              ${card.val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map(f => (
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
      {!loading && visible.length === 0 && <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.noInvoices}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {visible.map(inv => (
          <div key={inv.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {inv.invoiceNumber && (
                  <span style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 700, letterSpacing: "0.1em" }}>{inv.invoiceNumber}</span>
                )}
                <span style={{ fontSize: "14px", color: "var(--ivory)", fontWeight: 500 }}>{inv.billToName}</span>
                {inv.billToCompany && <span style={{ fontSize: "12px", color: "var(--steel)" }}>— {inv.billToCompany}</span>}
                <Badge s={inv.status} />
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
                {inv.total != null && (
                  <span style={{ fontSize: "13px", color: "var(--gold)", fontWeight: 600 }}>
                    {inv.currency} {inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {inv.amountPaid != null && inv.amountPaid > 0 && (
                  <span style={{ fontSize: "12px", color: "#4ade80" }}>
                    Paid: {inv.currency} {inv.amountPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                )}
                <span style={{ fontSize: "11px", color: "var(--steel)" }}>
                  Issued: {new Date(inv.issueDate).toLocaleDateString()}
                </span>
                {inv.dueDate && (
                  <span style={{ fontSize: "11px", color: inv.status === "overdue" ? "var(--crimson)" : "var(--steel)" }}>
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                )}
                {inv.quote && (
                  <span style={{ fontSize: "11px", color: "var(--steel)" }}>
                    Quote: {inv.quote.quoteNumber}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => downloadPdf(inv.id)} style={{ ...iconBtn, color: "var(--gold)" }} title={t.generatePdf}>
                <Download size={14} />
              </button>
              {inv.pdfPath && (
                <a href={`${API}${inv.pdfPath}`} target="_blank" style={iconBtn}><FileText size={14} /></a>
              )}
              <button onClick={() => { setEditing(inv); setShowForm(true); }} style={iconBtn}><Pencil size={14} /></button>
              <button onClick={() => del(inv.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <InvoiceModal
          initial={editing}
          clients={clients}
          quotes={quotes}
          onSave={save}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────

function InvoiceModal({ initial, clients, quotes, onSave, onClose }: {
  initial: Invoice | null;
  clients: Client[];
  quotes: Quote[];
  onSave: (d: Partial<Invoice>) => void;
  onClose: () => void;
}) {
  const { t: { admin: t } } = useLang();

  const parseItems = (s?: string): LineItem[] => { try { return JSON.parse(s || "[]"); } catch { return []; } };

  const [clientId, setClientId] = useState(initial?.clientId || "");
  const [form, setForm] = useState({
    invoiceNumber: initial?.invoiceNumber || "",
    quoteId: initial?.quoteId || "",
    billToName: initial?.billToName || "",
    billToCompany: initial?.billToCompany || "",
    billToAddress: initial?.billToAddress || "",
    billToCity: initial?.billToCity || "",
    billToState: initial?.billToState || "",
    billToZip: initial?.billToZip || "",
    billToEmail: initial?.billToEmail || "",
    billToPhone: initial?.billToPhone || "",
    subtotal: initial?.subtotal?.toString() || "",
    taxRate: initial?.taxRate?.toString() || "",
    taxAmount: initial?.taxAmount?.toString() || "",
    discount: initial?.discount?.toString() || "",
    total: initial?.total?.toString() || "",
    amountPaid: initial?.amountPaid?.toString() || "0",
    currency: initial?.currency || "USD",
    paymentTerms: initial?.paymentTerms || "Net 30",
    paymentMethod: initial?.paymentMethod || "",
    paymentNotes: initial?.paymentNotes || "",
    issueDate: initial?.issueDate ? new Date(initial.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    dueDate: initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : "",
    paidDate: initial?.paidDate ? new Date(initial.paidDate).toISOString().slice(0, 10) : "",
    status: initial?.status || "draft",
    poNumber: initial?.poNumber || "",
    notes: initial?.notes || "",
    terms: initial?.terms || "",
  });
  const [items, setItems] = useState<LineItem[]>(parseItems(initial?.lineItems));

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Auto-fill bill-to when client is selected
  useEffect(() => {
    if (!clientId) return;
    const c = clients.find(x => x.id === clientId);
    if (c && !initial) {
      setForm(f => ({
        ...f,
        billToName: c.name,
        billToCompany: c.company || "",
        billToAddress: c.address || "",
        billToCity: c.city || "",
        billToState: c.state || "",
        billToZip: c.zip || "",
        billToEmail: c.email || "",
        billToPhone: c.phone || "",
      }));
    }
  }, [clientId, clients, initial]);

  const recalc = (newItems: LineItem[]) => {
    const subtotal = newItems.reduce((s, i) => s + (i.total || 0), 0);
    const taxRate = parseFloat(form.taxRate) || 0;
    const discount = parseFloat(form.discount) || 0;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    setForm(f => ({ ...f, subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2), total: total.toFixed(2) }));
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
    onSave({
      clientId,
      ...form,
      quoteId: form.quoteId || undefined,
      subtotal: n(form.subtotal),
      taxRate: n(form.taxRate),
      taxAmount: n(form.taxAmount),
      discount: n(form.discount),
      total: n(form.total),
      amountPaid: n(form.amountPaid),
      lineItems: JSON.stringify(items),
      dueDate: form.dueDate || undefined,
      paidDate: form.paidDate || undefined,
    });
  };

  const ST = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--gold)", textTransform: "uppercase", paddingBottom: "6px", borderBottom: "1px solid var(--border)", marginTop: "4px" }}>
      {children}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "800px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>
            {initial ? t.edit : t.newInvoice}
          </span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <ST>Invoice Info</ST>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.invoiceNumber}><input value={form.invoiceNumber} onChange={set("invoiceNumber")} className="field" placeholder="Auto" /></Field>
            <Field label={t.invoiceDate}><input type="date" value={form.issueDate} onChange={set("issueDate")} className="field" /></Field>
            <Field label={t.dueDate}><input type="date" value={form.dueDate} onChange={set("dueDate")} className="field" /></Field>
            <Field label={t.status}>
              <select value={form.status} onChange={set("status")} className="field">
                {["draft","sent","paid","overdue","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.poNumber}><input value={form.poNumber} onChange={set("poNumber")} className="field" /></Field>
            <Field label="Link to Quote">
              <select value={form.quoteId} onChange={set("quoteId")} className="field">
                <option value="">— None —</option>
                {quotes.map(q => <option key={q.id} value={q.id}>{q.quoteNumber || q.id} — {q.title}</option>)}
              </select>
            </Field>
          </div>

          <ST>{t.billTo}</ST>
          <Field label="Client">
            <select value={clientId} onChange={e => setClientId(e.target.value)} className="field" required>
              <option value="">— Select client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ""}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Name *"><input value={form.billToName} onChange={set("billToName")} className="field" required /></Field>
            <Field label={t.company}><input value={form.billToCompany} onChange={set("billToCompany")} className="field" /></Field>
          </div>
          <Field label={t.address}><input value={form.billToAddress} onChange={set("billToAddress")} className="field" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <Field label={t.city}><input value={form.billToCity} onChange={set("billToCity")} className="field" /></Field>
            <Field label={t.state}><input value={form.billToState} onChange={set("billToState")} className="field" /></Field>
            <Field label={t.zip}><input value={form.billToZip} onChange={set("billToZip")} className="field" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Email"><input type="email" value={form.billToEmail} onChange={set("billToEmail")} className="field" /></Field>
            <Field label={t.phone}><input value={form.billToPhone} onChange={set("billToPhone")} className="field" /></Field>
          </div>

          <ST>Services / Line Items</ST>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 1fr 1fr 32px", gap: "8px", alignItems: "end" }}>
              <Field label={i === 0 ? "Description" : undefined}>
                <input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className="field" placeholder="Service or material description" />
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
              <button type="button" onClick={() => { const n = items.filter((_, j) => j !== i); setItems(n); recalc(n); }} style={{ ...iconBtn, color: "var(--crimson)", marginBottom: "4px" }}><X size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => setItems(p => [...p, { description: "", qty: 1, unitPrice: 0, total: 0 }])} style={secondaryBtn}>
            + {t.addLineItem}
          </button>

          <ST>Financial Summary</ST>
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
            <Field label={t.amountPaid}><input type="number" step="0.01" min="0" value={form.amountPaid} onChange={set("amountPaid")} className="field" /></Field>
            <Field label={t.paymentTerms}>
              <select value={form.paymentTerms} onChange={set("paymentTerms")} className="field">
                {["Net 15","Net 30","Net 45","Net 60","Due on Receipt","Net 90"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            {form.status === "paid" && (
              <Field label={t.paidDate}><input type="date" value={form.paidDate} onChange={set("paidDate")} className="field" /></Field>
            )}
          </div>

          <ST>Payment Details</ST>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={t.paymentMethod}>
              <select value={form.paymentMethod} onChange={set("paymentMethod")} className="field">
                <option value="">— Select —</option>
                {["Wire Transfer","ACH / Bank Transfer","Check","Credit Card","Zelle","Other"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label={t.paymentNotes}><input value={form.paymentNotes} onChange={set("paymentNotes")} className="field" placeholder="Account #, routing #, or other instructions" /></Field>
          </div>

          <ST>Notes & Terms</ST>
          <Field label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={2} /></Field>
          <Field label={t.terms}>
            <textarea value={form.terms} onChange={set("terms")} className="field" rows={2} placeholder="Payment is due by the date specified. Late payments may incur a 1.5% monthly finance charge." />
          </Field>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "8px" }}>
            <button type="button" onClick={onClose} style={secondaryBtn}>{t.cancel}</button>
            <button type="submit" className="btn-crimson">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
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

const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secondaryBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer", letterSpacing: "0.08em" };
