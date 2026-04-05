"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "@/lib/i18n/LangContext";
import { getToken } from "@/lib/auth";
import { Plus, Trash2, Pencil, X, Upload, Star, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const ORG = process.env.NEXT_PUBLIC_ORG_ID || "";

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type Project = {
  id: string; orgId: string; title_en: string; title_es: string;
  description_en: string; description_es: string; images: string[];
  category: string; aircraftType: string; client?: string; year: number;
  featured: boolean; visible: boolean; order: number; tags: string[];
};

type Service = {
  id: string; orgId: string; title_en: string; title_es: string;
  description_en: string; description_es: string; icon: string;
  image?: string; order: number; visible: boolean;
};

type Tab = "projects" | "services";

export default function PortfolioPage() {
  const { t: { admin: t } } = useLang();
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [pr, sv] = await Promise.all([
      fetch(`${API}/api/projects?orgId=${ORG}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/services?orgId=${ORG}`, { headers: authHeaders() }).then(r => r.ok ? r.json() : []),
    ]);
    setProjects(pr);
    setServices(sv);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteProject(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`${API}/api/projects/${id}`, { method: "DELETE", headers: authHeaders() });
    setProjects(p => p.filter(x => x.id !== id));
  }

  async function deleteService(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await fetch(`${API}/api/services/${id}`, { method: "DELETE", headers: authHeaders() });
    setServices(s => s.filter(x => x.id !== id));
  }

  async function saveProject(data: Partial<Project>) {
    const isNew = !editProject?.id;
    const url = isNew ? `${API}/api/projects` : `${API}/api/projects/${editProject!.id}`;
    const method = isNew ? "POST" : "PUT";
    const body = isNew ? { orgId: ORG, order: projects.length, featured: false, visible: true, tags: [], images: [], ...data } : data;
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowProjectForm(false); setEditProject(null); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  }

  async function saveService(data: Partial<Service>) {
    const isNew = !editService?.id;
    const url = isNew ? `${API}/api/services` : `${API}/api/services/${editService!.id}`;
    const method = isNew ? "POST" : "PUT";
    const body = isNew ? { orgId: ORG, order: services.length, visible: true, ...data } : data;
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowServiceForm(false); setEditService(null); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  }

  async function toggleProjectField(id: string, field: "featured" | "visible", val: boolean) {
    await fetch(`${API}/api/projects/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ [field]: val }) });
    setProjects(p => p.map(x => x.id === id ? { ...x, [field]: val } : x));
  }

  async function toggleServiceVisible(id: string, val: boolean) {
    await fetch(`${API}/api/services/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ visible: val }) });
    setServices(s => s.map(x => x.id === id ? { ...x, visible: val } : x));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1000px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "0" }}>
        {(["projects", "services"] as Tab[]).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            padding: "10px 24px", background: "none", border: "none",
            borderBottom: `2px solid ${tab === tb ? "var(--crimson)" : "transparent"}`,
            color: tab === tb ? "var(--ivory)" : "var(--steel)",
            fontSize: "12px", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase",
          }}>
            {t[tb as keyof typeof t] as string}
          </button>
        ))}
      </div>

      {/* Projects tab */}
      {tab === "projects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase" }}>
              {projects.length} {t.projects}
            </span>
            <button onClick={() => { setEditProject(null); setShowProjectForm(true); }} style={addBtn}>
              <Plus size={14} /> {t.newProject}
            </button>
          </div>
          {loading && <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}
          {!loading && projects.length === 0 && <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.noProjects}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {projects.map(p => (
              <div key={p.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Image */}
                <div style={{ position: "relative", height: "160px", background: "var(--charcoal)" }}>
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  {!p.images[0] && (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--steel)", fontSize: "12px" }}>No image</div>
                  )}
                  {/* Badges */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px" }}>
                    {p.featured && <span style={badge("gold")}>★ Featured</span>}
                    {!p.visible && <span style={badge("steel")}>Hidden</span>}
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500, marginBottom: "4px" }}>{p.title_en}</div>
                  <div style={{ fontSize: "11px", color: "var(--steel)", marginBottom: "12px" }}>
                    {p.category} · {p.aircraftType} · {p.year}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button onClick={() => toggleProjectField(p.id, "featured", !p.featured)} style={iconBtn} title="Toggle featured">
                      <Star size={14} style={{ fill: p.featured ? "var(--gold)" : "none", color: p.featured ? "var(--gold)" : "var(--steel)" }} />
                    </button>
                    <button onClick={() => toggleProjectField(p.id, "visible", !p.visible)} style={iconBtn} title="Toggle visible">
                      {p.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => { setEditProject(p); setShowProjectForm(true); }} style={iconBtn}><Pencil size={14} /></button>
                    <button onClick={() => deleteProject(p.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services tab */}
      {tab === "services" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--steel)", textTransform: "uppercase" }}>
              {services.length} {t.services}
            </span>
            <button onClick={() => { setEditService(null); setShowServiceForm(true); }} style={addBtn}>
              <Plus size={14} /> {t.newService}
            </button>
          </div>
          {loading && <p style={{ color: "var(--steel)", fontSize: "13px" }}>Loading…</p>}
          {!loading && services.length === 0 && <p style={{ color: "var(--steel)", fontSize: "13px" }}>{t.noServices}</p>}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {services.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px",
                borderBottom: i < services.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                {/* Image or icon */}
                <div style={{ width: "56px", height: "56px", flexShrink: 0, background: "var(--charcoal)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.image
                    ? <img src={`${API}${s.image}`} alt={s.title_en} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "10px", color: "var(--steel)", letterSpacing: "0.1em" }}>{s.icon}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "var(--ivory)", fontWeight: 500 }}>{s.title_en}</div>
                  <div style={{ fontSize: "11px", color: "var(--steel)", marginTop: "2px" }}>{s.title_es}</div>
                  <div style={{ fontSize: "11px", color: "var(--steel)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.description_en}
                  </div>
                </div>
                <button onClick={() => toggleServiceVisible(s.id, !s.visible)} style={iconBtn} title="Toggle visible">
                  {s.visible ? <Eye size={14} /> : <EyeOff size={14} style={{ color: "var(--steel)" }} />}
                </button>
                <button onClick={() => { setEditService(s); setShowServiceForm(true); }} style={iconBtn}><Pencil size={14} /></button>
                <button onClick={() => deleteService(s.id)} style={{ ...iconBtn, color: "var(--crimson)" }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project modal */}
      {showProjectForm && (
        <Modal title={editProject ? t.edit : t.newProject} onClose={() => { setShowProjectForm(false); setEditProject(null); }}>
          <ProjectForm initial={editProject} onSave={saveProject} onCancel={() => { setShowProjectForm(false); setEditProject(null); }} />
        </Modal>
      )}

      {/* Service modal */}
      {showServiceForm && (
        <Modal title={editService ? t.edit : t.newService} onClose={() => { setShowServiceForm(false); setEditService(null); }}>
          <ServiceForm initial={editService} onSave={saveService} onCancel={() => { setShowServiceForm(false); setEditService(null); }} />
        </Modal>
      )}
    </div>
  );
}

// ---- Project Form ----
function ProjectForm({ initial, onSave, onCancel }: { initial: Project | null; onSave: (d: Partial<Project>) => void; onCancel: () => void }) {
  const { t: { admin: t } } = useLang();
  const [form, setForm] = useState({
    title_en: initial?.title_en || "",
    title_es: initial?.title_es || "",
    description_en: initial?.description_en || "",
    description_es: initial?.description_es || "",
    category: initial?.category || "vip",
    aircraftType: initial?.aircraftType || "",
    client: initial?.client || "",
    year: initial?.year?.toString() || new Date().getFullYear().toString(),
    tags: initial?.tags?.join(", ") || "",
    images: initial?.images || [] as string[],
    newImageUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function addImageUrl() {
    if (!form.newImageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, f.newImageUrl.trim()], newImageUrl: "" }));
  }

  function removeImage(i: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
    if (res.ok) {
      const { path } = await res.json();
      setForm(f => ({ ...f, images: [...f.images, `${API}${path}`] }));
    }
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title_en: form.title_en, title_es: form.title_es,
      description_en: form.description_en, description_es: form.description_es,
      category: form.category, aircraftType: form.aircraftType,
      client: form.client, year: parseInt(form.year) || new Date().getFullYear(),
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      images: form.images,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FField label={`${t.title} EN`}><input value={form.title_en} onChange={set("title_en")} className="field" required /></FField>
        <FField label={`${t.title} ES`}><input value={form.title_es} onChange={set("title_es")} className="field" /></FField>
      </div>
      <FField label={`${t.description} EN`}><textarea value={form.description_en} onChange={set("description_en")} className="field" rows={3} /></FField>
      <FField label={`${t.description} ES`}><textarea value={form.description_es} onChange={set("description_es")} className="field" rows={3} /></FField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <FField label={t.category}>
          <select value={form.category} onChange={set("category")} className="field">
            {["vip", "completions", "refurbishment", "modification", "repair"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FField>
        <FField label={t.aircraftType}><input value={form.aircraftType} onChange={set("aircraftType")} className="field" /></FField>
        <FField label={t.year}><input type="number" value={form.year} onChange={set("year")} className="field" min="2000" max="2030" /></FField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FField label={t.client}><input value={form.client} onChange={set("client")} className="field" /></FField>
        <FField label={t.tags}><input value={form.tags} onChange={set("tags")} className="field" placeholder="Comma separated" /></FField>
      </div>

      {/* Images */}
      <FField label={t.images}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
          {form.images.map((img, i) => (
            <div key={i} style={{ position: "relative", width: "72px", height: "72px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", border: "1px solid var(--border)" }} />
              <button type="button" onClick={() => removeImage(i)} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(10,8,5,0.8)", border: "none", color: "var(--ivory)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}>
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input value={form.newImageUrl} onChange={e => setForm(f => ({ ...f, newImageUrl: e.target.value }))} className="field" placeholder={t.addImageUrl} style={{ flex: 1 }} />
          <button type="button" onClick={addImageUrl} style={smBtn}>Add URL</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px dashed var(--border)", color: "var(--steel)", fontSize: "11px", cursor: "pointer" }}>
          <Upload size={13} /> {uploading ? "Uploading…" : "Upload file"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
        </label>
      </FField>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
        <button type="button" onClick={onCancel} style={secBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

// ---- Service Form ----
function ServiceForm({ initial, onSave, onCancel }: { initial: Service | null; onSave: (d: Partial<Service>) => void; onCancel: () => void }) {
  const { t: { admin: t } } = useLang();
  const [form, setForm] = useState({
    title_en: initial?.title_en || "",
    title_es: initial?.title_es || "",
    description_en: initial?.description_en || "",
    description_es: initial?.description_es || "",
    icon: initial?.icon || "",
    image: initial?.image || "",
  });
  const [uploading, setUploading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd });
    if (res.ok) { const { path } = await res.json(); setForm(f => ({ ...f, image: path })); }
    setUploading(false);
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FField label={`${t.title} EN`}><input value={form.title_en} onChange={set("title_en")} className="field" required /></FField>
        <FField label={`${t.title} ES`}><input value={form.title_es} onChange={set("title_es")} className="field" /></FField>
      </div>
      <FField label={`${t.description} EN`}><textarea value={form.description_en} onChange={set("description_en")} className="field" rows={3} /></FField>
      <FField label={`${t.description} ES`}><textarea value={form.description_es} onChange={set("description_es")} className="field" rows={3} /></FField>
      <FField label={t.icon}><input value={form.icon} onChange={set("icon")} className="field" placeholder="Crown, Wrench, Scissors…" /></FField>

      {/* Image */}
      <FField label="Photo">
        {form.image && (
          <div style={{ marginBottom: "8px", position: "relative", display: "inline-block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image.startsWith("http") ? form.image : `${API}${form.image}`} alt="" style={{ height: "72px", objectFit: "cover", border: "1px solid var(--border)" }} />
            <button type="button" onClick={() => setForm(f => ({ ...f, image: "" }))} style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(10,8,5,0.8)", border: "none", color: "var(--ivory)", cursor: "pointer", padding: "2px", display: "flex" }}>
              <X size={10} />
            </button>
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px dashed var(--border)", color: "var(--steel)", fontSize: "11px", cursor: "pointer" }}>
          <Upload size={13} /> {uploading ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
        </label>
      </FField>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
        <button type="button" onClick={onCancel} style={secBtn}>{t.cancel}</button>
        <button type="submit" className="btn-crimson">{t.save}</button>
      </div>
    </form>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,5,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", overflowY: "auto" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "100%", maxWidth: "580px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "13px", letterSpacing: "0.15em", color: "var(--ivory)", textTransform: "uppercase" }}>{title}</span>
          <button onClick={onClose} style={iconBtn}><X size={16} /></button>
        </div>
        <div style={{ padding: "24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>{label}</label>
      {children}
    </div>
  );
}

function badge(color: "gold" | "steel"): React.CSSProperties {
  return { fontSize: "9px", letterSpacing: "0.1em", padding: "2px 6px", background: "rgba(10,8,5,0.8)", color: color === "gold" ? "var(--gold)" : "var(--steel)", border: `1px solid ${color === "gold" ? "rgba(201,168,76,0.4)" : "var(--border)"}`, textTransform: "uppercase" };
}

const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: "var(--ivory)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--steel)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" };
const secBtn: React.CSSProperties = { padding: "8px 16px", background: "none", border: "1px solid var(--border)", color: "var(--steel)", fontSize: "12px", cursor: "pointer" };
const smBtn: React.CSSProperties = { padding: "8px 12px", background: "rgba(187,35,25,0.12)", border: "1px solid rgba(187,35,25,0.3)", color: "var(--ivory)", fontSize: "11px", cursor: "pointer" };
