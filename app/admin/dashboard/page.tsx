"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { useLang } from "@/lib/i18n/LangContext";
import { Mail, MailOpen, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API}/api/contact?orgId=${process.env.NEXT_PUBLIC_ORG_ID}${filter === "unread" ? "&unread=true" : ""}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [filter]);

  const markRead = async (id: string, isRead: boolean) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    await fetch(`${API}/api/contact/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ isRead }),
    });
    fetchMessages();
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "";
    await fetch(`${API}/api/contact/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    toast.success(t.admin.delete + "d");
    fetchMessages();
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "2rem", fontWeight: 300, fontStyle: "italic", color: "var(--ivory)", margin: 0 }}>
            {t.admin.messages}
          </h1>
          {unreadCount > 0 && (
            <span style={{ fontSize: "11px", color: "var(--crimson)", letterSpacing: "0.1em" }}>
              {unreadCount} {t.admin.unread}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 20px", border: "none", cursor: "pointer",
                fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase",
                background: filter === f ? "var(--crimson)" : "var(--surface)",
                color: filter === f ? "var(--ivory)" : "var(--steel)",
                transition: "all 0.2s",
              }}
            >
              {f === "all" ? "All" : t.admin.unread}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {loading && <p style={{ color: "var(--steel)", fontSize: "14px" }}>Loading…</p>}
      {!loading && messages.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--steel)", fontSize: "14px" }}>
          {t.admin.noMessages}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              background: "var(--surface)",
              border: `1px solid ${!msg.isRead ? "rgba(187,35,25,0.25)" : "var(--border)"}`,
              overflow: "hidden",
            }}
          >
            {/* Summary row */}
            <div
              style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
              onClick={() => {
                setExpanded(expanded === msg.id ? null : msg.id);
                if (!msg.isRead) markRead(msg.id, true);
              }}
            >
              <div style={{
                width: "34px", height: "34px",
                background: msg.isRead ? "rgba(107,114,128,0.1)" : "rgba(187,35,25,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {msg.isRead
                  ? <MailOpen size={15} color="var(--steel)" />
                  : <Mail size={15} color="var(--crimson)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--ivory)", fontSize: "14px", fontWeight: 500 }}>{msg.name}</span>
                  {msg.company && <span style={{ color: "var(--steel)", fontSize: "12px" }}>— {msg.company}</span>}
                  {!msg.isRead && (
                    <span style={{ background: "var(--crimson)", color: "var(--ivory)", fontSize: "9px", fontWeight: 700, padding: "2px 8px", letterSpacing: "0.1em" }}>
                      {t.admin.newMessage}
                    </span>
                  )}
                </div>
                <div style={{ color: "var(--steel)", fontSize: "12px" }}>{msg.email}</div>
                <p style={{ color: "var(--ivory-dim)", fontSize: "13px", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {msg.message}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <span style={{ color: "var(--steel)", fontSize: "11px" }}>
                  {new Date(msg.createdAt).toLocaleDateString()}
                </span>
                {expanded === msg.id ? <ChevronUp size={14} color="var(--steel)" /> : <ChevronDown size={14} color="var(--steel)" />}
              </div>
            </div>

            {/* Expanded */}
            {expanded === msg.id && (
              <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
                <p style={{ color: "var(--ivory-dim)", fontSize: "14px", lineHeight: 1.75, margin: "16px 0" }}>
                  {msg.message}
                </p>
                {(msg.phone || msg.service) && (
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px", fontSize: "12px" }}>
                    {msg.phone && <span style={{ color: "var(--steel)" }}>Phone: <strong style={{ color: "var(--ivory-dim)" }}>{msg.phone}</strong></span>}
                    {msg.service && <span style={{ color: "var(--steel)" }}>Service: <strong style={{ color: "var(--ivory-dim)" }}>{msg.service}</strong></span>}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => markRead(msg.id, !msg.isRead)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(245,240,232,0.05)", color: "var(--steel)", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    {msg.isRead ? <Mail size={13} /> : <MailOpen size={13} />}
                    {msg.isRead ? "Mark Unread" : t.admin.markRead}
                  </button>
                  <a
                    href={`mailto:${msg.email}`}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(201,168,76,0.08)", color: "var(--gold)", textDecoration: "none", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    <Reply size={13} />
                    {t.admin.reply}
                  </a>
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "rgba(187,35,25,0.08)", color: "var(--crimson)", border: "none", cursor: "pointer", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    <Trash2 size={13} />
                    {t.admin.delete}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
