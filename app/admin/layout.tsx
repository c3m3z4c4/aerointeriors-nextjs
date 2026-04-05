"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import { useLang } from "@/lib/i18n/LangContext";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, Kanban, LogOut, LayoutDashboard, Menu, Users, CalendarDays, FileText, Settings } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const [checked, setChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setChecked(true); return; }
    if (!getToken()) { router.replace("/admin/login"); return; }
    setChecked(true);
  }, [pathname, router]);

  const handleLogout = () => { clearToken(); router.push("/"); };

  if (!checked) return null;
  if (pathname === "/admin/login") return <>{children}</>;

  const navItems = [
    { href: "/admin/dashboard", label: t.admin.messages, icon: <MessageSquare size={16} /> },
    { href: "/admin/kanban", label: t.admin.kanban, icon: <Kanban size={16} /> },
    { href: "/admin/crm", label: t.admin.crm, icon: <Users size={16} /> },
    { href: "/admin/appointments", label: t.admin.appointments, icon: <CalendarDays size={16} /> },
    { href: "/admin/content", label: t.admin.content, icon: <FileText size={16} /> },
    { href: "/admin/settings", label: t.admin.settings, icon: <Settings size={16} /> },
  ];

  const Sidebar = () => (
    <aside style={{
      width: "220px", flexShrink: 0,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "0",
      height: "100%",
    }}>
      {/* Brand */}
      <div style={{ padding: "28px 24px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <Image src="/assets/img/AvionAPN.png" alt="AIS" width={26} height={26} style={{ objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ivory)", letterSpacing: "0.1em", fontFamily: "var(--font-cormorant, serif)" }}>AIRCRAFT</div>
            <div style={{ fontSize: "7px", letterSpacing: "0.18em", color: "var(--gold)" }}>INTERIORS</div>
          </div>
        </Link>
        <div style={{ marginTop: "8px", fontSize: "9px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase" }}>
          Admin Panel
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "20px 16px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", borderRadius: "2px",
                textDecoration: "none",
                fontSize: "12px", letterSpacing: "0.08em",
                color: isActive ? "var(--ivory)" : "var(--steel)",
                background: isActive ? "rgba(187,35,25,0.12)" : "transparent",
                borderLeft: isActive ? "2px solid var(--crimson)" : "2px solid transparent",
                transition: "all 0.2s", marginBottom: "4px",
              }}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "20px 16px", borderTop: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", color: "var(--steel)", textDecoration: "none", fontSize: "12px", marginBottom: "4px" }}>
          <LayoutDashboard size={16} />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "none", border: "none", color: "var(--steel)", cursor: "pointer", fontSize: "12px", width: "100%", transition: "color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--crimson)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--steel)")}
        >
          <LogOut size={16} />
          {t.admin.login === "Admin Access" ? "Sign out" : "Salir"}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden" }}>
      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(10,8,5,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{ width: "220px", height: "100%", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <header style={{
          height: "56px", flexShrink: 0,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 24px",
          gap: "16px",
        }}>
          <button
            className="admin-menu-toggle"
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", color: "var(--ivory)", cursor: "pointer", display: "none" }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: "var(--font-cormorant, serif)", fontSize: "16px", color: "var(--ivory)", fontStyle: "italic" }}>
            {navItems.find((n) => n.href === pathname)?.label || "Admin"}
          </span>
          {/* Crimson dot indicator */}
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--crimson)", marginLeft: "auto" }} />
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: "auto", padding: "32px" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-menu-toggle { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
