"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverlay, DragStartEvent, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, X, GripVertical, Plane, User, ChevronDown } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type Priority = "low" | "medium" | "high";

interface KanbanCard {
  id: string;
  title: string;
  aircraft?: string;
  client?: string;
  priority: Priority;
  column: string;
  notes?: string;
  order: number;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#BB2319",
  medium: "#c9a84c",
  low: "#4ade80",
};

// ── Droppable column wrapper (makes empty columns accept drops) ──────────────
function DroppableZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: "80px",
        transition: "background 0.15s",
        background: isOver ? "rgba(187,35,25,0.06)" : "transparent",
        borderRadius: "2px",
      }}
    >
      {children}
    </div>
  );
}

// ── Sortable card ─────────────────────────────────────────────────────────────
function SortableCard({ card, onDelete, onClick }: { card: KanbanCard; onDelete: (id: string) => void; onClick: (card: KanbanCard) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`kanban-item${isDragging ? " dragging" : ""}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <div {...attributes} {...listeners} style={{ color: "var(--steel)", cursor: "grab", marginTop: "2px", flexShrink: 0, touchAction: "none" }}>
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: PRIORITY_COLORS[card.priority] }} />
              <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--steel)" }}>
                {card.priority}
              </span>
            </div>
            <button onClick={() => onDelete(card.id)} style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: 0, lineHeight: 0 }}>
              <X size={12} />
            </button>
          </div>

          <p
            onClick={() => onClick(card)}
            style={{ color: "var(--ivory)", fontSize: "13px", fontWeight: 500, margin: "0 0 8px", lineHeight: 1.4, cursor: "pointer" }}
          >
            {card.title}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {card.aircraft && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--steel)" }}>
                <Plane size={9} /> {card.aircraft}
              </span>
            )}
            {card.client && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "rgba(107,114,128,0.6)" }}>
                <User size={9} /> {card.client}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drag overlay (ghost) ─────────────────────────────────────────────────────
function CardGhost({ card }: { card: KanbanCard }) {
  return (
    <div className="kanban-item dragging" style={{ width: "260px" }}>
      <p style={{ color: "var(--ivory)", fontSize: "13px", margin: 0, fontWeight: 500 }}>{card.title}</p>
    </div>
  );
}

// ── New/Edit card modal ───────────────────────────────────────────────────────
function CardModal({
  initial, columns, onSave, onClose,
}: {
  initial: KanbanCard | null;
  columns: { id: string; label: string }[];
  onSave: (data: Omit<KanbanCard, "id" | "order">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    aircraft: initial?.aircraft || "",
    client: initial?.client || "",
    priority: (initial?.priority || "medium") as Priority,
    column: initial?.column || "inquiry",
    notes: initial?.notes || "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "480px" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>
            {initial ? "Edit Task" : "New Task"}
          </span>
          <button onClick={onClose} style={iconBtnS}><X size={16} /></button>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); onSave(form); }}
          style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Field label="Title">
            <input value={form.title} onChange={set("title")} className="field" required autoFocus placeholder="e.g. G650 Full Interior Refurbishment" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Aircraft">
              <input value={form.aircraft} onChange={set("aircraft")} className="field" placeholder="e.g. Gulfstream G650" />
            </Field>
            <Field label="Client">
              <input value={form.client} onChange={set("client")} className="field" placeholder="e.g. Private Client" />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Priority">
              <div style={{ position: "relative" }}>
                <select value={form.priority} onChange={set("priority")} className="field" style={{ appearance: "none", paddingRight: "28px" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--steel)", pointerEvents: "none" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PRIORITY_COLORS[form.priority], position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </Field>
            <Field label="Stage">
              <div style={{ position: "relative" }}>
                <select value={form.column} onChange={set("column")} className="field" style={{ appearance: "none", paddingRight: "28px" }}>
                  {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--steel)", pointerEvents: "none" }} />
              </div>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={set("notes")} className="field" rows={3} placeholder="Additional details…" />
          </Field>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} style={secBtnS}>Cancel</button>
            <button type="submit" className="btn-crimson" style={{ padding: "9px 24px", fontSize: "11px", letterSpacing: "0.12em" }}>
              {initial ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const { t } = useLang();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = [
    { id: "inquiry",    label: t.admin.columns.inquiry,    color: "var(--steel)" },
    { id: "quoted",     label: t.admin.columns.quoted,     color: "var(--gold)" },
    { id: "inProgress", label: t.admin.columns.inProgress, color: "var(--crimson)" },
    { id: "review",     label: t.admin.columns.review,     color: "#60a5fa" },
    { id: "delivered",  label: t.admin.columns.delivered,  color: "#4ade80" },
  ];

  // ── Load from API ──────────────────────────────────────────────────────────
  const loadCards = useCallback(async () => {
    const res = await fetch(`${API}/api/kanban?orgId=${ORG}`, { headers: authHeaders() });
    if (res.ok) setCards(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  // ── API helpers ────────────────────────────────────────────────────────────
  async function apiCreate(data: Omit<KanbanCard, "id" | "order">) {
    const res = await fetch(`${API}/api/kanban`, {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ orgId: ORG, order: cards.length, ...data }),
    });
    if (res.ok) await loadCards();
  }

  async function apiUpdate(id: string, data: Partial<KanbanCard>) {
    await fetch(`${API}/api/kanban/${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify(data),
    });
  }

  async function apiDelete(id: string) {
    await fetch(`${API}/api/kanban/${id}`, { method: "DELETE", headers: authHeaders() });
  }

  async function apiReorder(items: { id: string; order: number }[]) {
    await fetch(`${API}/api/kanban/reorder`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ items }),
    });
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;

    const overCol = columns.find(col => col.id === over.id);
    const overCard = cards.find(c => c.id === over.id);

    if (overCol) {
      // Dropped on empty column or column droppable zone
      if (activeCard.column === overCol.id) return;
      setCards(prev => prev.map(c => c.id === active.id ? { ...c, column: overCol.id } : c));
      apiUpdate(active.id as string, { column: overCol.id });
    } else if (overCard) {
      if (activeCard.column === overCard.column) {
        // Reorder within same column
        const col = cards.filter(c => c.column === activeCard.column);
        const reordered = arrayMove(col, col.findIndex(c => c.id === active.id), col.findIndex(c => c.id === over.id));
        const rest = cards.filter(c => c.column !== activeCard.column);
        setCards([...rest, ...reordered]);
        // Debounce reorder API call
        if (pendingSave.current) clearTimeout(pendingSave.current);
        pendingSave.current = setTimeout(() => {
          apiReorder(reordered.map((c, i) => ({ id: c.id, order: i })));
        }, 600);
      } else {
        // Move to different column, insert at drop position
        const moved = { ...activeCard, column: overCard.column };
        const destCol = cards.filter(c => c.column === overCard.column);
        const insertAt = destCol.findIndex(c => c.id === over.id);
        const newDest = [...destCol.slice(0, insertAt), moved, ...destCol.slice(insertAt)];
        const rest = cards.filter(c => c.column !== overCard.column && c.id !== active.id);
        setCards([...rest, ...newDest]);
        apiUpdate(active.id as string, { column: overCard.column });
      }
    }
  };

  // ── Create / edit ──────────────────────────────────────────────────────────
  function handleSaveModal(data: Omit<KanbanCard, "id" | "order">) {
    if (editingCard) {
      setCards(prev => prev.map(c => c.id === editingCard.id ? { ...c, ...data } : c));
      apiUpdate(editingCard.id, data);
    } else {
      apiCreate(data);
    }
    setShowModal(false);
    setEditingCard(null);
  }

  function handleDelete(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
    apiDelete(id);
  }

  function openEdit(card: KanbanCard) {
    setEditingCard(card);
    setShowModal(true);
  }

  const activeCard = cards.find(c => c.id === activeId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: 0 }}>
            {t.admin.kanban}
          </h1>
          <p style={{ color: "var(--steel)", fontSize: "12px", margin: "4px 0 0", letterSpacing: "0.08em" }}>
            {cards.length} task{cards.length !== 1 ? "s" : ""} · drag cards between stages
          </p>
        </div>
        <button
          onClick={() => { setEditingCard(null); setShowModal(true); }}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px",
            background: "var(--crimson)", border: "none",
            color: "#fff", fontSize: "12px", letterSpacing: "0.12em",
            textTransform: "uppercase", cursor: "pointer",
            fontWeight: 600, transition: "opacity 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={15} /> New Task
        </button>
      </div>

      {loading && <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}

      {!loading && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))`, gap: "10px", overflowX: "auto", paddingBottom: "8px", alignItems: "start" }}>
            {columns.map(col => {
              const colCards = cards.filter(c => c.column === col.id).sort((a, b) => a.order - b.order);
              return (
                <div key={col.id} className="kanban-col" style={{ display: "flex", flexDirection: "column" }}>
                  {/* Column header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                      <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ivory-dim)", fontWeight: 600 }}>
                        {col.label}
                      </span>
                    </div>
                    <span style={{ background: "rgba(245,240,232,0.06)", color: "var(--steel)", fontSize: "10px", padding: "2px 8px", fontWeight: 600 }}>
                      {colCards.length}
                    </span>
                  </div>

                  {/* Droppable zone (works even when empty) */}
                  <DroppableZone id={col.id}>
                    <SortableContext items={colCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {colCards.map(card => (
                          <SortableCard key={card.id} card={card} onDelete={handleDelete} onClick={openEdit} />
                        ))}
                        {colCards.length === 0 && (
                          <div style={{ height: "60px", border: "1px dashed rgba(245,240,232,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "10px", color: "var(--steel)", letterSpacing: "0.1em" }}>Drop here</span>
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DroppableZone>

                  {/* Quick add button */}
                  <button
                    onClick={() => { setEditingCard(null); setShowModal(true); }}
                    style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", width: "100%", padding: "8px", background: "none", border: "1px dashed rgba(245,240,232,0.08)", color: "var(--steel)", cursor: "pointer", fontSize: "11px", transition: "border-color 0.2s, color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(187,35,25,0.3)"; (e.currentTarget as HTMLElement).style.color = "var(--ivory)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,240,232,0.08)"; (e.currentTarget as HTMLElement).style.color = "var(--steel)"; }}
                  >
                    <Plus size={13} /> {t.admin.addCard}
                  </button>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeCard ? <CardGhost card={activeCard} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <CardModal
          initial={editingCard}
          columns={columns}
          onSave={handleSaveModal}
          onClose={() => { setShowModal(false); setEditingCard(null); }}
        />
      )}
    </div>
  );
}

const iconBtnS: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secBtnS: React.CSSProperties = { padding: "9px 18px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer" };
