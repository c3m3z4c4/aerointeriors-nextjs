"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import { useLang } from "@/lib/i18n/LangContext";
import { Mail, MailOpen, Trash2, Reply, ChevronDown, ChevronUp, Phone, Copy } from "lucide-react";
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

  function waLink(phone: string, name: string, service?: string) {
    const clean = phone.replace(/[^\d+]/g, "");
    const text = encodeURIComponent(
      `Hi ${name}! We received your message${service ? ` about *${service}*` : ""} and we'd love to discuss your project. How can we help you?`
    );
    return `https://wa.me/${clean.replace(/^\+/, "")}?text=${text}`;
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

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

                {/* Contact details */}
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "20px", padding: "12px 16px", background: "rgba(245,240,232,0.03)", border: "1px solid var(--border)" }}>
                  {msg.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Phone size={12} color="var(--steel)" />
                      <span style={{ color: "var(--ivory-dim)", fontSize: "13px", fontWeight: 500 }}>{msg.phone}</span>
                      <button onClick={() => copyText(msg.phone!)} style={copyBtn} title="Copy">
                        <Copy size={11} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Mail size={12} color="var(--steel)" />
                    <span style={{ color: "var(--ivory-dim)", fontSize: "13px" }}>{msg.email}</span>
                    <button onClick={() => copyText(msg.email)} style={copyBtn} title="Copy">
                      <Copy size={11} />
                    </button>
                  </div>
                  {msg.service && (
                    <span style={{ color: "var(--steel)", fontSize: "12px" }}>
                      Service: <strong style={{ color: "var(--gold)" }}>{msg.service}</strong>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {/* WhatsApp — primary when phone available */}
                  {msg.phone ? (
                    <a
                      href={waLink(msg.phone, msg.name, msg.service)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        padding: "9px 18px",
                        background: "#25D366", color: "#fff",
                        textDecoration: "none", fontSize: "11px",
                        letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      {/* WhatsApp icon */}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.112.551 4.1 1.516 5.833L.044 23.244a.75.75 0 0 0 .92.92l5.44-1.487A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.68-.51-5.21-1.4l-.37-.22-3.83 1.04 1.01-3.72-.24-.38A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      WhatsApp
                    </a>
                  ) : (
                    /* No phone — show email as primary */
                    <a
                      href={`mailto:${msg.email}?subject=Re: Your inquiry to Aircraft Interiors Solutions`}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "rgba(201,168,76,0.12)", color: "var(--gold)", textDecoration: "none", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
                    >
                      <Reply size={13} /> Reply by Email
                    </a>
                  )}

                  {/* Email always available as secondary when WhatsApp shown */}
                  {msg.phone && (
                    <a
                      href={`mailto:${msg.email}?subject=Re: Your inquiry to Aircraft Interiors Solutions`}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "rgba(245,240,232,0.04)", border: "1px solid var(--border)", color: "var(--steel)", textDecoration: "none", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", transition: "color 0.2s, border-color 0.2s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--ivory)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,240,232,0.2)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--steel)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}

                  <div style={{ flex: 1 }} />

                  <button
                    onClick={() => markRead(msg.id, !msg.isRead)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
                  >
                    {msg.isRead ? <Mail size={13} /> : <MailOpen size={13} />}
                    {msg.isRead ? "Mark Unread" : t.admin.markRead}
                  </button>
                  <button
                    onClick={() => deleteMsg(msg.id)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "rgba(187,35,25,0.08)", border: "none", color: "var(--crimson)", cursor: "pointer", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
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

const copyBtn: React.CSSProperties = {
  background: "none", border: "none", color: "var(--steel)",
  cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center",
  opacity: 0.6, transition: "opacity 0.2s",
};
