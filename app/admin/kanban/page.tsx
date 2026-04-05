"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLang } from "@/lib/i18n/LangContext";
import { Plus, X, GripVertical, Plane } from "lucide-react";

interface KanbanCard {
  id: string;
  title: string;
  aircraft?: string;
  client?: string;
  priority?: "low" | "medium" | "high";
  column: string;
}

interface Column {
  id: string;
  label: string;
  color: string;
}

const DEFAULT_CARDS: KanbanCard[] = [
  { id: "c1", title: "Gulfstream G650 Full Interior", aircraft: "G650", client: "Private Client", priority: "high", column: "inProgress" },
  { id: "c2", title: "BBJ Leather Reupholstery", aircraft: "Boeing BBJ", client: "Corp Aviation", priority: "medium", column: "quoted" },
  { id: "c3", title: "Citation XLS Carpet Replace", aircraft: "Citation XLS", client: "Charter Co.", priority: "low", column: "inquiry" },
  { id: "c4", title: "G450 LED Upgrade", aircraft: "G450", client: "Family Office", priority: "medium", column: "review" },
  { id: "c5", title: "Falcon 7X Wood Veneer", aircraft: "Falcon 7X", client: "Exec Client", priority: "high", column: "delivered" },
];

const PRIORITY_COLORS = { high: "#BB2319", medium: "#c9a84c", low: "#4ade80" };

function SortableCard({ card, onDelete }: { card: KanbanCard; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`kanban-item${isDragging ? " dragging" : ""}`}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <div {...attributes} {...listeners} style={{ color: "var(--steel)", cursor: "grab", marginTop: "2px", flexShrink: 0 }}>
          <GripVertical size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Priority + delete */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: PRIORITY_COLORS[card.priority || "low"],
            }} />
            <button
              onClick={() => onDelete(card.id)}
              style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "0", lineHeight: 0 }}
            >
              <X size={12} />
            </button>
          </div>

          <p style={{ color: "var(--ivory)", fontSize: "13px", fontWeight: 500, margin: "0 0 8px", lineHeight: 1.4 }}>
            {card.title}
          </p>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {card.aircraft && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--steel)", letterSpacing: "0.06em" }}>
                <Plane size={9} /> {card.aircraft}
              </span>
            )}
            {card.client && (
              <span style={{ fontSize: "10px", color: "rgba(107,114,128,0.6)", letterSpacing: "0.06em" }}>
                {card.client}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardOverlay({ card }: { card: KanbanCard }) {
  return (
    <div className="kanban-item dragging" style={{ width: "260px" }}>
      <p style={{ color: "var(--ivory)", fontSize: "13px", margin: 0 }}>{card.title}</p>
    </div>
  );
}

export default function KanbanPage() {
  const { t } = useLang();
  const [cards, setCards] = useState<KanbanCard[]>(DEFAULT_CARDS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns: Column[] = [
    { id: "inquiry", label: t.admin.columns.inquiry, color: "var(--steel)" },
    { id: "quoted", label: t.admin.columns.quoted, color: "var(--gold)" },
    { id: "inProgress", label: t.admin.columns.inProgress, color: "var(--crimson)" },
    { id: "review", label: t.admin.columns.review, color: "#60a5fa" },
    { id: "delivered", label: t.admin.columns.delivered, color: "#4ade80" },
  ];

  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id as string);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeCard = cards.find((c) => c.id === active.id);
    const overCard = cards.find((c) => c.id === over.id);
    const overCol = columns.find((col) => col.id === over.id);

    if (!activeCard) return;

    if (overCol) {
      // Dropped on column header
      setCards((prev) => prev.map((c) => c.id === active.id ? { ...c, column: overCol.id } : c));
    } else if (overCard) {
      if (activeCard.column !== overCard.column) {
        // Moving to different column
        setCards((prev) => prev.map((c) => c.id === active.id ? { ...c, column: overCard.column } : c));
      } else {
        // Reorder within same column
        const colCards = cards.filter((c) => c.column === activeCard.column);
        const oldIdx = colCards.findIndex((c) => c.id === active.id);
        const newIdx = colCards.findIndex((c) => c.id === over.id);
        const reordered = arrayMove(colCards, oldIdx, newIdx);
        const otherCards = cards.filter((c) => c.column !== activeCard.column);
        setCards([...otherCards, ...reordered]);
      }
    }
  };

  const addCard = (colId: string) => {
    if (!newTitle.trim()) return;
    setCards((prev) => [...prev, {
      id: `c${Date.now()}`,
      title: newTitle.trim(),
      column: colId,
      priority: "medium",
    }]);
    setNewTitle("");
    setAddingTo(null);
  };

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const activeCard = cards.find((c) => c.id === activeId);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: 0 }}>
          {t.admin.kanban}
        </h1>
        <p style={{ color: "var(--steel)", fontSize: "12px", margin: "6px 0 0", letterSpacing: "0.08em" }}>
          Drag cards between columns to track project progress
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(220px, 1fr))`,
          gap: "12px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}>
          {columns.map((col) => {
            const colCards = cards.filter((c) => c.column === col.id);
            return (
              <div key={col.id} className="kanban-col">
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: col.color }} />
                    <span style={{ fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ivory-dim)", fontWeight: 600 }}>
                      {col.label}
                    </span>
                  </div>
                  <span style={{
                    background: "rgba(245,240,232,0.06)",
                    color: "var(--steel)", fontSize: "10px",
                    padding: "2px 8px", borderRadius: "2px",
                    fontWeight: 600,
                  }}>
                    {colCards.length}
                  </span>
                </div>

                {/* Cards */}
                <SortableContext items={colCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "100px" }}>
                    {colCards.map((card) => (
                      <SortableCard key={card.id} card={card} onDelete={deleteCard} />
                    ))}
                  </div>
                </SortableContext>

                {/* Add card */}
                {addingTo === col.id ? (
                  <div style={{ marginTop: "12px" }}>
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCard(col.id); if (e.key === "Escape") setAddingTo(null); }}
                      placeholder={t.admin.cardTitle}
                      style={{
                        width: "100%", background: "var(--void)", border: "1px solid var(--crimson)",
                        color: "var(--ivory)", padding: "8px 10px", fontSize: "12px", outline: "none",
                        marginBottom: "6px",
                      }}
                    />
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => addCard(col.id)} className="btn-crimson" style={{ padding: "6px 14px", fontSize: "10px" }}>
                        {t.admin.addCard}
                      </button>
                      <button onClick={() => setAddingTo(null)} style={{ background: "none", border: "none", color: "var(--steel)", cursor: "pointer", fontSize: "10px" }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(col.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      marginTop: "12px", width: "100%", padding: "8px",
                      background: "none", border: "1px dashed rgba(245,240,232,0.08)",
                      color: "var(--steel)", cursor: "pointer", fontSize: "11px",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(187,35,25,0.3)";
                      (e.currentTarget as HTMLElement).style.color = "var(--ivory)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,240,232,0.08)";
                      (e.currentTarget as HTMLElement).style.color = "var(--steel)";
                    }}
                  >
                    <Plus size={13} /> {t.admin.addCard}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeCard ? <CardOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
