"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

type ViewMode = "month" | "week" | "day" | "year";
type Appointment = {
  id: string; title: string; date: string; duration: number;
  status: string; notes?: string; clientId?: string;
  client?: { id: string; name: string; company?: string };
};
type Client = { id: string; name: string; company?: string };

const statusColor: Record<string, string> = {
  scheduled: "var(--gold)", completed: "#4ade80", cancelled: "var(--crimson)",
};

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

function startOf(mode: ViewMode, ref: Date): Date {
  const d = new Date(ref);
  if (mode === "month" || mode === "year") { d.setDate(1); d.setHours(0, 0, 0, 0); }
  else if (mode === "week") {
    const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0);
  } else { d.setHours(0, 0, 0, 0); }
  return d;
}

function endOf(mode: ViewMode, start: Date): Date {
  const d = new Date(start);
  if (mode === "month") { d.setMonth(d.getMonth() + 1); d.setDate(0); d.setHours(23, 59, 59, 999); }
  else if (mode === "year") { d.setFullYear(d.getFullYear() + 1); d.setDate(0); d.setHours(23, 59, 59, 999); }
  else if (mode === "week") { d.setDate(d.getDate() + 6); d.setHours(23, 59, 59, 999); }
  else { d.setHours(23, 59, 59, 999); }
  return d;
}

function navigate(mode: ViewMode, ref: Date, dir: 1 | -1): Date {
  const d = new Date(ref);
  if (mode === "month") d.setMonth(d.getMonth() + dir);
  else if (mode === "year") d.setFullYear(d.getFullYear() + dir);
  else if (mode === "week") d.setDate(d.getDate() + dir * 7);
  else d.setDate(d.getDate() + dir);
  return d;
}

function fmtHeader(mode: ViewMode, ref: Date): string {
  const opts: Intl.DateTimeFormatOptions =
    mode === "year" ? { year: "numeric" } :
    mode === "month" ? { month: "long", year: "numeric" } :
    mode === "week" ? { month: "short", day: "numeric" } :
    { weekday: "long", month: "long", day: "numeric", year: "numeric" };
  return new Intl.DateTimeFormat(undefined, opts).format(ref);
}

export default function AppointmentsPage() {
  const { t } = useLang();
  const [view, setView] = useState<ViewMode>("month");
  const [ref, setRef] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  const fetchAppts = useCallback(async () => {
    const start = startOf(view, ref);
    const end = endOf(view, start);
    const res = await fetch(
      `${API}/api/appointments?orgId=${ORG}&from=${start.toISOString()}&to=${end.toISOString()}`,
      { headers: authHeaders() }
    );
    if (res.ok) setAppointments(await res.json());
  }, [view, ref]);

  useEffect(() => { fetchAppts(); }, [fetchAppts]);
  useEffect(() => {
    fetch(`${API}/api/crm/clients?orgId=${ORG}`, { headers: authHeaders() })
      .then(r => r.json()).then(setClients).catch(() => {});
  }, []);

  async function deleteAppt(id: string) {
    if (!confirm(t.admin.confirmDelete)) return;
    await fetch(`${API}/api/appointments/${id}`, { method: "DELETE", headers: authHeaders() });
    fetchAppts();
  }

  async function saveAppt(data: Partial<Appointment> & { date: string }) {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API}/api/appointments/${editing.id}` : `${API}/api/appointments`;
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify({ orgId: ORG, ...data }) });
    if (res.ok) { fetchAppts(); setShowForm(false); setEditing(null); }
  }

  const apptsByDay = (day: Date) => {
    const ds = day.toDateString();
    return appointments.filter(a => new Date(a.date).toDateString() === ds);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0", border: "1px solid var(--border)" }}>
          {(["month", "week", "day", "year"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "7px 14px", background: v === view ? "rgba(187,35,25,0.15)" : "none",
              border: "none", borderRight: v !== "year" ? "1px solid var(--border)" : "none",
              color: v === view ? "var(--ivory)" : "var(--steel)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "capitalize",
            }}>{v}</button>
          ))}
        </div>
        <button onClick={() => setRef(navigate(view, ref, -1))} style={navBtn}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: "13px", color: "var(--ivory)", minWidth: "180px", textAlign: "center", textTransform: "capitalize" }}>{fmtHeader(view, ref)}</span>
        <button onClick={() => setRef(navigate(view, ref, 1))} style={navBtn}><ChevronRight size={16} /></button>
        <button onClick={() => setRef(new Date())} style={{ ...navBtn, fontSize: "11px", padding: "6px 12px" }}>Today</button>
        <button onClick={() => { setEditing(null); setDefaultDate(new Date()); setShowForm(true); }} style={{ ...addBtn, marginLeft: "auto" }}>
          <Plus size={14} /> {t.admin.newAppointment}
        </button>
      </div>

      {/* Calendar */}
      <div style={{ flex: 1, overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)" }}>
        {view === "month" && <MonthView ref_={ref} apptsByDay={apptsByDay} onDayClick={d => { setDefaultDate(d); setShowForm(true); }} onEdit={a => { setEditing(a); setShowForm(true); }} onDelete={deleteAppt} />}
        {view === "week" && <WeekView ref_={ref} apptsByDay={apptsByDay} onDayClick={d => { setDefaultDate(d); setShowForm(true); }} onEdit={a => { setEditing(a); setShowForm(true); }} onDelete={deleteAppt} />}
        {view === "day" && <DayView ref_={ref} appointments={apptsByDay(ref)} onNew={() => { setDefaultDate(ref); setShowForm(true); }} onEdit={a => { setEditing(a); setShowForm(true); }} onDelete={deleteAppt} />}
        {view === "year" && <YearView ref_={ref} apptsByDay={apptsByDay} onMonthClick={d => { setRef(d); setView("month"); }} />}
      </div>

      {/* Form modal */}
      {showForm && (
        <AppointmentModal
          initial={editing}
          defaultDate={defaultDate || new Date()}
          clients={clients}
          t={t.admin}
          onSave={saveAppt}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

// Month view
function MonthView({ ref_, apptsByDay, onDayClick, onEdit, onDelete }: {
  ref_: Date; apptsByDay: (d: Date) => Appointment[];
  onDayClick: (d: Date) => void; onEdit: (a: Appointment) => void; onDelete: (id: string) => void;
}) {
  const start = startOf("month", ref_);
  const firstDay = start.getDay();
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const today = new Date();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : new Date(start.getFullYear(), start.getMonth(), i - firstDay + 1));
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--border)" }}>
        {DAY_NAMES.map(d => <div key={d} style={{ padding: "8px", textAlign: "center", fontSize: "10px", letterSpacing: "0.12em", color: "var(--steel)" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {cells.map((day, i) => {
          const appts = day ? apptsByDay(day) : [];
          const isToday = day?.toDateString() === today.toDateString();
          return (
            <div key={i} onClick={() => day && onDayClick(day)} style={{
              minHeight: "90px", padding: "6px", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
              background: day ? "transparent" : "rgba(0,0,0,0.1)", cursor: day ? "pointer" : "default",
              position: "relative",
            }}>
              {day && (
                <>
                  <span style={{ fontSize: "12px", color: isToday ? "var(--crimson)" : "var(--steel)", fontWeight: isToday ? 700 : 400, display: "inline-block", width: "22px", height: "22px", lineHeight: "22px", textAlign: "center", borderRadius: "50%", background: isToday ? "rgba(187,35,25,0.15)" : "transparent" }}>
                    {day.getDate()}
                  </span>
                  <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {appts.slice(0, 3).map(a => (
                      <div key={a.id} onClick={e => { e.stopPropagation(); onEdit(a); }} style={{ fontSize: "10px", padding: "2px 5px", background: `${statusColor[a.status]}22`, borderLeft: `2px solid ${statusColor[a.status]}`, color: "var(--ivory)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}>
                        {new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} {a.title}
                      </div>
                    ))}
                    {appts.length > 3 && <div style={{ fontSize: "10px", color: "var(--steel)" }}>+{appts.length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week view
function WeekView({ ref_, apptsByDay, onDayClick, onEdit, onDelete }: {
  ref_: Date; apptsByDay: (d: Date) => Appointment[];
  onDayClick: (d: Date) => void; onEdit: (a: Appointment) => void; onDelete: (id: string) => void;
}) {
  const start = startOf("week", ref_);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const today = new Date();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
      {days.map((day, i) => {
        const appts = apptsByDay(day);
        const isToday = day.toDateString() === today.toDateString();
        return (
          <div key={i} style={{ borderRight: i < 6 ? "1px solid var(--border)" : "none", minHeight: "400px" }}>
            <div onClick={() => onDayClick(day)} style={{ padding: "10px", borderBottom: "1px solid var(--border)", textAlign: "center", cursor: "pointer", background: isToday ? "rgba(187,35,25,0.06)" : "transparent" }}>
              <div style={{ fontSize: "10px", color: "var(--steel)", letterSpacing: "0.1em" }}>{new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(day)}</div>
              <div style={{ fontSize: "20px", color: isToday ? "var(--crimson)" : "var(--ivory)", fontWeight: 300 }}>{day.getDate()}</div>
            </div>
            <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {appts.map(a => (
                <div key={a.id} onClick={() => onEdit(a)} style={{ fontSize: "11px", padding: "6px 8px", background: `${statusColor[a.status]}22`, borderLeft: `2px solid ${statusColor[a.status]}`, color: "var(--ivory)", cursor: "pointer" }}>
                  <div style={{ fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: "10px", color: "var(--steel)", marginTop: "2px" }}>{new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Day view
function DayView({ ref_, appointments, onNew, onEdit, onDelete }: {
  ref_: Date; appointments: Appointment[];
  onNew: () => void; onEdit: (a: Appointment) => void; onDelete: (id: string) => void;
}) {
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {hours.map(h => {
        const appts = appointments.filter(a => new Date(a.date).getHours() === h);
        return (
          <div key={h} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: "56px" }}>
            <div style={{ width: "56px", padding: "8px", fontSize: "11px", color: "var(--steel)", flexShrink: 0, textAlign: "right" }}>{h}:00</div>
            <div style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {appts.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: `${statusColor[a.status]}22`, borderLeft: `2px solid ${statusColor[a.status]}` }}>
                  <span style={{ flex: 1, fontSize: "13px", color: "var(--ivory)" }}>{a.title}</span>
                  {a.client && <span style={{ fontSize: "11px", color: "var(--steel)" }}>{a.client.name}</span>}
                  <span style={{ fontSize: "11px", color: "var(--steel)" }}>{a.duration}min</span>
                  <button onClick={() => onEdit(a)} style={iconBtnS}><Pencil size={12} /></button>
                  <button onClick={() => onDelete(a.id)} style={{ ...iconBtnS, color: "var(--crimson)" }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Year view
function YearView({ ref_, apptsByDay, onMonthClick }: { ref_: Date; apptsByDay: (d: Date) => Appointment[]; onMonthClick: (d: Date) => void }) {
  const year = ref_.getFullYear();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)" }}>
      {Array.from({ length: 12 }, (_, m) => {
        const ms = new Date(year, m, 1);
        const days = new Date(year, m + 1, 0).getDate();
        const firstDay = ms.getDay();
        return (
          <div key={m} onClick={() => onMonthClick(ms)} style={{ background: "var(--surface)", padding: "12px", cursor: "pointer" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "var(--ivory)", marginBottom: "8px" }}>
              {new Intl.DateTimeFormat(undefined, { month: "long" }).format(ms)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "1px" }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: days }, (_, i) => {
                const d = new Date(year, m, i + 1);
                const hasAppts = apptsByDay(d).length > 0;
                return <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: hasAppts ? "var(--crimson)" : "var(--border)" }} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AppointmentModal({ initial, defaultDate, clients, t: tRaw, onSave, onClose }: {
  initial: Appointment | null; defaultDate: Date; clients: Client[];
  t: Record<string, unknown>; onSave: (d: Partial<Appointment> & { date: string }) => void; onClose: () => void;
}) {
  const t = tRaw as Record<string, string>;
  const localDt = (d: Date) => { const s = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString(); return s.slice(0, 16); };
  const [form, setForm] = useState({
    title: initial?.title || "",
    date: initial ? localDt(new Date(initial.date)) : localDt(defaultDate),
    duration: initial?.duration?.toString() || "60",
    clientId: initial?.clientId || "",
    notes: initial?.notes || "",
    status: initial?.status || "scheduled",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "480px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>
            {initial ? t.edit : t.newAppointment}
          </span>
          <button onClick={onClose} style={iconBtnS}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...form, duration: parseInt(form.duration), clientId: form.clientId || undefined }); }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <FField label="Title" required><input value={form.title} onChange={set("title")} className="field" required /></FField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FField label="Date & Time" required><input type="datetime-local" value={form.date} onChange={set("date")} className="field" required /></FField>
            <FField label={t.duration}><input type="number" value={form.duration} onChange={set("duration")} className="field" min="15" step="15" /></FField>
          </div>
          <FField label={t.client}>
            <select value={form.clientId} onChange={set("clientId")} className="field">
              <option value="">— None —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
            </select>
          </FField>
          <FField label={t.status}>
            <select value={form.status} onChange={set("status")} className="field">
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FField>
          <FField label={t.notes}><textarea value={form.notes} onChange={set("notes")} className="field" rows={3} /></FField>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={secBtn}>{t.cancel}</button>
            <button type="submit" className="btn-crimson">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{label}{required && " *"}</label>
      {children}
    </div>
  );
}

const navBtn: React.CSSProperties = { padding: "6px 10px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", cursor: "pointer", display: "flex", alignItems: "center" };
const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: "var(--ivory)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer" };
const iconBtnS: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer" };
