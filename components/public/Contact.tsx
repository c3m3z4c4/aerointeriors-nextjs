"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n/LangContext";
import { Phone, Mail, MapPin, Send } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const SERVICES = [
  "Full Interiors",
  "Wood Working",
  "Cabin Modification",
  "Carpet & Flooring",
  "Custom Stitching",
  "Seat Reupholstery",
  "LED Lighting",
  "Leather Repair",
  "R&R Inspection",
];

export default function Contact() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const els = sectionRef.current?.querySelectorAll(".reveal") ?? [];
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "";
      await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, orgId: process.env.NEXT_PUBLIC_ORG_ID }),
      });
      toast.success(t.contact.success);
      reset();
    } catch {
      toast.error(t.contact.error);
    }
  };

  return (
    <section id="contact" ref={sectionRef} style={{ padding: "120px 0", background: "var(--surface)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "100px", alignItems: "start" }}>
          {/* Info side */}
          <div>
            <div className="reveal" style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", letterSpacing: "0.28em", color: "var(--gold)", textTransform: "uppercase" }}>
                {t.contact.label}
              </span>
            </div>
            <h2 className="reveal" style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 300, fontStyle: "italic",
              color: "var(--ivory)", margin: "0 0 8px", lineHeight: 1.2,
            }}>
              {t.contact.title}
            </h2>
            <span className="rule reveal" style={{ margin: "20px 0 36px" }} />

            {/* Contact details */}
            <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {[
                { icon: <Mail size={16} color="var(--crimson)" />, val: "info@air-interiors.com" },
                { icon: <Phone size={16} color="var(--crimson)" />, val: "+1 (800) 555-0100" },
                { icon: <MapPin size={16} color="var(--crimson)" />, val: "Aviation Business Park, Suite 200\nLos Angeles, CA 90045" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ marginTop: "1px", flexShrink: 0 }}>{item.icon}</div>
                  <span style={{ color: "var(--ivory-dim)", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider quote */}
            <div className="reveal" style={{ marginTop: "48px", paddingLeft: "20px", borderLeft: "2px solid var(--crimson)" }}>
              <p style={{
                fontFamily: "var(--font-cormorant, serif)",
                fontSize: "1.4rem", fontStyle: "italic",
                color: "var(--ivory)", lineHeight: 1.5, margin: 0,
              }}>
                &ldquo;Excellence is not a skill — it&rsquo;s an attitude.&rdquo;
              </p>
              <span style={{ fontSize: "11px", color: "var(--gold)", letterSpacing: "0.15em", marginTop: "10px", display: "block" }}>
                — AIS PHILOSOPHY
              </span>
            </div>
          </div>

          {/* Form */}
          <form className="reveal" onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {t.contact.name} *
                </label>
                <input {...register("name")} className="field" />
                {errors.name && <span style={{ color: "var(--crimson)", fontSize: "11px" }}>Required</span>}
              </div>
              <div>
                <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {t.contact.email} *
                </label>
                <input {...register("email")} type="email" className="field" />
                {errors.email && <span style={{ color: "var(--crimson)", fontSize: "11px" }}>Valid email required</span>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {t.contact.phone}
                </label>
                <input {...register("phone")} type="tel" className="field" placeholder="+1 555 123 4567" />
                <span style={{ fontSize: "10px", color: "var(--steel)", marginTop: "4px", display: "block" }}>
                  Include country code, e.g. +1 555 123 4567
                </span>
              </div>
              <div>
                <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {t.contact.company}
                </label>
                <input {...register("company")} className="field" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                {t.contact.service}
              </label>
              <select {...register("service")} className="field" style={{ background: "transparent" }}>
                <option value="">{t.contact.selectService}</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "9.5px", letterSpacing: "0.22em", color: "var(--steel)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                {t.contact.message} *
              </label>
              <textarea {...register("message")} rows={5} className="field" style={{ resize: "none" }} />
              {errors.message && <span style={{ color: "var(--crimson)", fontSize: "11px" }}>Required</span>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-crimson" style={{ alignSelf: "flex-start" }}>
              {isSubmitting ? t.contact.sending : t.contact.send}
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #contact [style*="grid-template-columns: 1fr 1.4fr"] {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
}
