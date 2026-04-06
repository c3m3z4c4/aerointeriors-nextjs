# Aircraft Interiors Solutions — Rebuild Prompt

> Use this prompt with any AI coding assistant to rebuild or extend this project.
> Provide the reference image alongside this prompt.

---

## The Prompt

---

You are a **senior fullstack developer with 10 years of experience** specializing in React, Next.js (App Router), Zustand, and Tailwind CSS. You write clean, maintainable, production-ready code. You follow best practices for accessibility, performance, and testing. You have deep knowledge of component-driven development, design systems, and enterprise-grade frontend architecture.

---

### Context

You are rebuilding and extending the web platform for **Aircraft Interiors Solutions (AIS)** — a premium aviation interior refurbishment company. The stack is:

- **Frontend:** Next.js 15+ (App Router, TypeScript), Tailwind CSS v4, Zustand
- **Backend:** Node.js + Express + Prisma ORM + PostgreSQL (already built — do not change)
- **Testing:** Vitest + React Testing Library (unit), Storybook 8 (component docs), Playwright (E2E)
- **PDF:** `pdf-lib` (server-side generation, already implemented)
- **Auth:** JWT, Bearer token in localStorage (`ais-token`)
- **i18n:** English / Spanish toggle, persisted to localStorage (`ais-lang`)

---

### Design System — Strict Constraints

**Reuse exactly these tokens. Do not invent new colors.**

```css
/* Dark theme (default) */
--void:         #0a0805;   /* page background */
--charcoal:     #141008;
--surface:      #1a1410;   /* card/panel background */
--surface-2:    #221c14;
--crimson:      #BB2319;   /* primary accent */
--crimson-bright:#d4291e;
--gold:         #c9a84c;   /* secondary accent */
--gold-light:   #e8c96d;
--ivory:        #f5f0e8;   /* primary text */
--ivory-dim:    #c8bfaf;   /* secondary text */
--steel:        #6b7280;   /* muted text / labels */
--border:       rgba(201,168,76,0.12);

/* Light theme — toggled via data-theme="light" on <html> */
--void:    #f8f5f0;
--surface: #f0ece4;
--ivory:   #1a1410;
--gold:    #8a6820;
--border:  rgba(187,35,25,0.1);
```

**Typography:**
- Display / headings: `Cormorant Garamond` (serif, italic, weight 300–400)
- Body / UI: `Outfit` (sans-serif, weight 300–600)
- Letter-spacing on labels: `0.18em–0.28em`, all-caps, `font-size: 9–11px`

**Logo:** `/public/assets/img/AvionAPN.png` — white version on dark backgrounds (CSS `filter: brightness(0) invert(1)`), original on light.

**Visual language (from reference image):**
- Dark, rich backgrounds with subtle warm undertones (not pure black)
- Crimson as the dominant action color (CTAs, active states, accents)
- Gold used sparingly for price totals, premium highlights, section markers
- Thin borders, no border-radius (sharp corners throughout)
- Micro-animations: `cubic-bezier(0.23,1,0.32,1)`, duration 300–850ms
- Film grain overlay (`opacity: 0.028`) on the public site
- Reveal-on-scroll animations (IntersectionObserver, `translateY(32px) → 0`)

---

### Architecture

#### State Management — Zustand

Replace all `useState` + `useCallback` patterns in admin pages with Zustand stores:

```
/stores
  authStore.ts       — token, user, login/logout actions
  langStore.ts       — lang, setLang (replaces LangContext)
  themeStore.ts      — theme, toggle (replaces useTheme)
  crmStore.ts        — clients[], selected, quotes[], actions
  quoteStore.ts      — quotes[], filters, loading, actions
  invoiceStore.ts    — invoices[], filters, stats, actions
  kanbanStore.ts     — columns, cards, drag state, actions
  appointmentStore.ts
  backupStore.ts
```

Each store handles its own API calls. Components only read state and call actions.

#### Folder Structure

```
/app
  /(public)          — public-facing pages (layout with Header/Footer)
    page.tsx         — home (all sections)
    /gallery
    /services
  /(admin)           — admin panel (layout with Sidebar/Topbar)
    /dashboard       — inbox messages
    /quotes          — standalone quotes page ★
    /invoices        — invoices with summary cards ★
    /crm             — clients + quotes per client ★
    /kanban          — drag-and-drop project board ★
    /appointments    — calendar/list of appointments ★
    /portfolio       — projects + services CRUD ★
    /backup          — export/import/schedule ★
    /settings        — admin users, site settings ★
    /content         — hero, sections, company data ★
    /login
/components
  /public            — Hero, About, Services, Gallery, Contact, Header, Footer
  /admin             — Sidebar, Topbar, Modal, Badge, Field, LineItemsEditor
  /ui                — Button, Input, Select, Textarea, Badge, Card (Tailwind-based)
/stores              — Zustand stores
/lib
  /api               — typed fetch wrappers per resource
  /i18n              — translations.ts + langStore
  auth.ts
/hooks               — useDebounce, useMediaQuery, usePdfDownload
```

#### API Layer

Create typed wrappers for every endpoint:

```typescript
// lib/api/quotes.ts
export const quotesApi = {
  list:       (orgId: string) => apiFetch<Quote[]>(`/api/crm/quotes?orgId=${orgId}`),
  create:     (data: CreateQuoteInput) => apiFetch<Quote>('/api/crm/quotes', { method:'POST', body: data }),
  update:     (id: string, data: Partial<Quote>) => apiFetch<Quote>(`/api/crm/quotes/${id}`, { method:'PUT', body: data }),
  delete:     (id: string) => apiFetch<void>(`/api/crm/quotes/${id}`, { method:'DELETE' }),
  generatePdf:(id: string) => apiFetchBlob(`/api/crm/quotes/${id}/pdf`, { method:'POST' }),
};
```

---

### Features to Implement (All Required)

#### Public Site

| Section | Notes |
|---------|-------|
| **Hero** | Full-viewport, video/image background, animated tagline, dual CTA buttons |
| **About** | Stats (20+ years, 200+ aircraft, 100% FAA certified), paragraph, scroll reveal |
| **Services** | Grid of cards fetched from `/api/services`, fallback to static data |
| **Gallery** | Masonry/grid fetched from `/api/projects`, lightbox on click |
| **Contact** | Form with react-hook-form + zod validation; phone field with country-code hint (`+1 555 123 4567`) |
| **AI Chat** | Floating chat widget connected to `/api/ai` |
| **Language toggle** | EN / ES, persisted to localStorage |
| **Theme toggle** | Dark / Light, persisted to localStorage, `data-theme` on `<html>` |

#### Admin Panel

| Page | Key Features |
|------|-------------|
| **Dashboard** | Inbox messages, read/unread, expand detail, WhatsApp reply (primary), email (secondary), copy phone/email |
| **Quotes** ★ | All quotes list, filter by status, summary cards (total/approved/pending/value), expand row to see line items table, create/edit modal with: client selector, aircraft info (make/model/year/tail), project description, scope-of-work line items (service/desc/qty/unit/total, auto-calc), financial summary (subtotal/discount/tax/total/deposit), timeline, payment terms, validity date, terms & conditions, PDF download |
| **Invoices** ★ | List with summary cards (invoiced/collected/outstanding), filter by status, Bill-To auto-fill from client, line items, financial summary (subtotal/discount/tax/total/paid/balance), payment method (Wire/ACH/Check/CC/Zelle), PO number, PDF download |
| **CRM** | Client list with address/city/state/zip, client detail with quotes, inline quote creation, PDF download per quote |
| **Kanban** | 5 columns (Inquiry/Quoted/In Progress/Review/Delivered), drag-and-drop (dnd-kit), empty column drops, persist to backend, create task modal defaulting to Inquiry, priority dots |
| **Appointments** | Calendar + list view, create/edit with client selector and duration |
| **Portfolio** | Projects (image grid, bilingual EN/ES, featured/visible toggles) + Services (icon + image) |
| **Backup** | Export full JSON, save to server, list saved backups with download/delete, CSV export (clients + kanban), CSV import, scheduled backups (hourly/daily/weekly via node-cron) |
| **Settings** | Admin user management, site settings (company data, hero text, colors, AI provider) |
| **Content** | Edit hero, section titles, footer text |

**Admin UI requirements:**
- EN/ES toggle in topbar (pills: `EN | ES`)
- Dark/Light toggle in topbar
- Sticky sidebar with active state (crimson left border)
- Logo visible in both themes (invert filter in dark)
- All monetary inputs: `min="0"`, `step="0.01"`, no negatives
- PDF download: always `document.body.appendChild(a); a.click(); document.body.removeChild(a)` pattern

---

### PDF Generation (pdf-lib, server-side)

Both Quote PDF and Invoice PDF must include:
- **Header bar** (dark `#0a0805`): logo left, company name + phone + email right
- **Gold accent line** (`#c9a84c`, 2px) below header
- **Document title** in crimson (`#BB2319`)
- Section headings: small-caps gold labels with crimson left-border block
- **Line items table**: dark header row, alternating ivory/white rows, gold total column
- **Totals block**: crimson background for TOTAL row, gold BALANCE DUE
- **Footer**: dark bar with document number and generation date
- Auto-generated numbers: `QT-YYYY-NNNN` (quotes), `INV-YYYY-NNNN` (invoices)

---

### Testing Requirements

#### Unit Tests — Vitest + React Testing Library

Test coverage targets: **≥ 80%** on stores and utility functions, **≥ 60%** on components.

```
/tests/unit
  /stores
    quoteStore.test.ts     — CRUD actions, computed stats, optimistic updates
    invoiceStore.test.ts   — status transitions, balance calculations
    kanbanStore.test.ts    — card moves, column reordering
    authStore.test.ts      — login/logout, token persistence
  /utils
    pdfDownload.test.ts    — blob URL creation, DOM append/remove pattern
    formatters.test.ts     — money(), shortDate(), wrapText()
  /components
    Badge.test.tsx         — renders correct color per status
    LineItemsEditor.test.tsx — add/remove rows, auto-calc totals
    QuoteModal.test.tsx    — form validation, submit payload shape
    InvoiceModal.test.tsx  — bill-to auto-fill from client selection
```

Run with: `vitest run --coverage`

#### Storybook 8

Every shared UI component must have a story:

```
/stories
  /ui
    Button.stories.tsx      — primary, secondary, disabled, loading states
    Badge.stories.tsx       — all statuses (draft/sent/approved/rejected/paid/overdue)
    Card.stories.tsx        — surface / surface-2 variants
    Field.stories.tsx       — with label, required, error state
  /admin
    Sidebar.stories.tsx     — dark theme, active item highlighted
    LineItemsEditor.stories.tsx — empty, 3 items, totals calculation
    QuoteRow.stories.tsx    — collapsed and expanded states
    InvoiceSummaryCards.stories.tsx
  /public
    HeroSection.stories.tsx — dark bg, with/without video
    ServiceCard.stories.tsx — hover state
    ContactForm.stories.tsx — idle, submitting, success, error
```

Use `@storybook/nextjs` addon. Configure the design system tokens as Storybook theme parameters.

Run with: `storybook dev -p 6006`

#### Playwright — E2E Tests

```
/tests/e2e
  auth.spec.ts         — login flow, redirect to /admin/dashboard, logout
  quotes.spec.ts       — create quote with line items, verify total calculation,
                         download PDF (check blob URL created), edit, delete
  invoices.spec.ts     — create invoice, auto-fill bill-to from client,
                         status filter works, download PDF
  kanban.spec.ts       — drag card from Inquiry to Quoted, verify persistence
  crm.spec.ts          — create client, create quote from client detail
  lang-toggle.spec.ts  — toggle EN↔ES, verify nav labels change
  theme-toggle.spec.ts — toggle dark↔light, verify data-theme attribute
```

Run with: `playwright test`

---

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ORG_ID=<org-id-from-db>

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/aerointeriors
JWT_SECRET=<secret>
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
```

---

### Docker (existing — do not change)

```dockerfile
# backend/Dockerfile
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node prisma/seed.js && node src/app.js"]

# frontend/Dockerfile
COPY BUILD_VERSION .   # ← change this file to bust Docker layer cache
COPY . .
RUN npm run build
```

Always update `BUILD_VERSION` with a new timestamp before pushing to trigger a fresh Docker build.

---

### Key Conventions

1. **No negative monetary values** — all `<input type="number">` for money use `min="0"`
2. **Programmatic downloads** — always append to DOM: `body.appendChild(a); a.click(); body.removeChild(a)`
3. **Language** — all user-facing strings go through the translation system; never hardcode EN/ES text in components
4. **Toast feedback** — every async action (save, delete, PDF, import) shows `toast.success()` or `toast.error()` via Sonner
5. **Auth headers** — `Authorization: Bearer ${getToken()}` on every admin API call
6. **orgId** — always pass `NEXT_PUBLIC_ORG_ID` as query param or body field to every API request
7. **Sharp corners** — `border-radius: 0` everywhere; this is a design choice
8. **Mobile admin** — sidebar collapses to hamburger menu below 768px

---

### Reference

- Current repo (Next.js frontend): `github.com/c3m3z4c4/aerointeriors-nextjs`
- Current repo (Backend): `github.com/c3m3z4c4/aerointeriors-backend`
- Deploy: Dokploy on VPS — use **Deploy** (not Rebuild) to pull latest git + rebuild

---

*Provide a reference image alongside this prompt to guide the visual redesign.*
*All features listed above must be implemented. Do not omit any section.*
