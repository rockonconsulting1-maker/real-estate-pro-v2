# RC CRM — Design System

A calm, dense, keyboard-friendly CRM for independent real-estate agents. The
product targets two surfaces — a focused **mobile** experience for
in-the-field work, and a **desktop** workspace for planning, pipeline review,
and offer ops. Both surfaces share one design language; this document is the
source of truth for tokens, primitives, and the patterns that make the product
feel coherent across screens.

This design system is the source of truth for the **production
build** — a single responsive **React 18 + TypeScript** app. The
tokens, primitives, and patterns below map directly
onto the production stack (see "Stack & implementation" below); the token
values here are authoritative and live in code at `src/styles/tokens.css`.

The voice is **professional, human, slightly understated**. The product is a
working tool, not a marketing site — so we avoid ornament, gradients, glass,
and decorative iconography. Where there's room for warmth it comes from
generous spacing, a warm-leaning neutral, and the cadence of copy.

---

## Stack & implementation

The build realizes this design system on a locked stack. Every primitive and
token below has a concrete home in the codebase.

| Layer | Technology |
| ----- | ---------- |
| Framework | React 18 |
| Build tool | Vite |
| Language | TypeScript (strict) |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS with a CSS-variable token system |
| UI components | shadcn/ui on Radix UI primitives |
| Server state | TanStack Query |
| Local state | React Context + hooks |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |
| Charts | recharts |
| Dates | date-fns |

**How the design system maps onto the stack:**

- **Tokens → CSS variables + Tailwind.** Every `--token` in §2–4 lives in
  `src/styles/tokens.css` as a CSS custom property and is surfaced to Tailwind
  through `tailwind.config` theme extensions (colors, radius, boxShadow,
  spacing, fontFamily, fontSize). Components reference tokens via Tailwind
  utilities that resolve to `var(--token)` — never hardcoded hex/oklch in
  component files.
- **Primitives → shadcn/ui components.** The components in §5 are built as
  shared React components in `src/components/ui` on top of shadcn/ui + Radix
  (Button, Card, Table, Badge, Tabs/ToggleGroup, Progress, Dialog, Sheet,
  Popover, Command, Tooltip, …), themed with the tokens. The `.class` names in
  §5 are the prototype's reference names; in the build they become component
  props/variants, not literal classes.
- **Icons → lucide-react** (§7). `strokeWidth={1.6}`, 24×24 default.
- **Charts / sparklines → recharts** (§5.3, §12.5).
- **Dates, countdowns, relative time → date-fns** (§5.6, §9), wrapped in shared
  `Money`, `Countdown`, and `formatMoney`/`formatWhen` helpers.
- **Forms → React Hook Form + Zod**; validation copy follows §9's error voice.
- **Data → TanStack Query**; all live values (KPIs, lists, events) come from
  query hooks. Any prototype `window.MOCK` / `window.Icon` reference in this
  doc is historical — the build uses live data and lucide-react.
- **Routing → React Router v6**; a `useSurface()` breakpoint hook selects
  desktop vs. mobile view components off the shared route tree (desktop
  ≥1024px, mobile <1024px).
- **Responsiveness is breakpoint-driven, not device-driven.** The "iPhone 15"
  and "1440×900" figures in §4 are prototype reference frames; the build is
  fluid within each surface.

---

## 1. Principles

1. **One accent, no rainbow.** A single calm blue carries selection, focus,
   and the active progress fill. Stage and role hues are quiet and only used
   when they encode meaning (lane, role, urgency). Never decorate with color.
2. **Type does the work.** Hierarchy is built by weight, size, and tabular
   numerals — not by boxes, dividers, or shadows. Money and time are always
   monospaced/tabular so columns align without effort.
3. **Density on purpose.** Agents live in lists. Default to comfortable but
   tight rows; reach for whitespace at section breaks, not inside every cell.
4. **Surface earns its elevation.** Cards get a single hairline border + a
   one-pixel shadow. Modal-class affordances (FAB, sticky action bar) get
   `--shadow-2`. Nothing else floats.
5. **Time is a first-class citizen.** Anything with a deadline (offer
   expiry, task, appointment) shows a countdown chip whose tone reflects
   urgency. The user should never have to compute "how long do I have?".
6. **Placeholders over slop.** Never invent imagery or icons we don't have.
   Use the striped `.ph` swatch with a monospaced label until a real asset
   exists.

---

## 2. Color tokens

All colors are defined in oklch so we can shift lightness or chroma without
re-picking hues. Saturation on neutrals stays under 0.02 — anything higher
reads as tinted.

> **In the build:** these tokens are declared as CSS variables in
> `src/styles/tokens.css` and mapped into Tailwind's theme (`tailwind.config`),
> so components use utilities like `bg-surface`, `text-ink-2`, `border-border`
> that resolve to `var(--token)`. Dark mode overrides the same variables under
> a `[data-theme="dark"]` selector (§12.1) — one edit point, no per-component
> color. Never hardcode oklch/hex in component files.

### 2.1 Surfaces & ink (warm neutral, hue 85)

| Token         | Value                       | Use                                       |
| ------------- | --------------------------- | ----------------------------------------- |
| `--bg`        | `oklch(0.985 0.004 85)`     | App background, sidebar, topbar           |
| `--bg-sunk`   | `oklch(0.965 0.005 85)`     | Page area behind cards, table headers     |
| `--bg-deep`   | `oklch(0.945 0.006 85)`     | Empty progress track, board column rest   |
| `--surface`   | `#ffffff`                   | Cards, rows, popovers                     |

### 2.2 Ink (cool neutral, hue 260)

| Token       | Value                       | Use                          |
| ----------- | --------------------------- | ---------------------------- |
| `--ink`     | `oklch(0.20 0.015 260)`     | Primary text, headings       |
| `--ink-2`   | `oklch(0.40 0.012 260)`     | Body, table cells            |
| `--ink-3`   | `oklch(0.58 0.010 260)`     | Meta, captions, placeholders |
| `--ink-4`   | `oklch(0.72 0.008 260)`     | Disabled, icon rest          |
| `--border`  | `oklch(0.90 0.006 260)`     | Card edges, inputs, dividers |
| `--border-2`| `oklch(0.94 0.005 260)`     | Internal separators          |

### 2.3 Brand & semantic

| Token              | Value                       | Use                                     |
| ------------------ | --------------------------- | --------------------------------------- |
| `--brand`          | `oklch(0.54 0.165 254)`     | Selection, active progress, primary link|
| `--brand-ink`      | `oklch(0.42 0.16 254)`      | Text on `--brand-soft`                  |
| `--brand-soft`     | `oklch(0.955 0.028 254)`    | Selected row, brand badge bg            |
| `--success`        | `oklch(0.60 0.15 150)`      | Closed deals, on-time countdowns        |
| `--warning`        | `oklch(0.72 0.155 70)`      | Within-day deadlines, tight drive time  |
| `--destructive`    | `oklch(0.60 0.21 25)`       | Overdue, expired offers, notification   |
| `--info`           | `oklch(0.65 0.13 230)`      | Reschedule action, neutral status       |

Each has a `*-soft` companion at L≈0.955 used as the badge/chip background.
Solid hues are only used on stroke (offer expiry pill, timeline pip border)
or on inverted surfaces.

### 2.4 Role hues (Buyer / Seller / Past / Vendor / SOI)

Five tints used **only** for the avatar background and role chip. They share
chroma so no role visually outweighs another.

| Role     | Hue | Avatar bg                  | Chip bg / fg                          |
| -------- | --- | -------------------------- | ------------------------------------- |
| Buyer    | 254 | `oklch(0.62 0.14 254)`     | `oklch(0.96 0.03 254)` / `0.40 0.14`  |
| Seller   | 310 | `oklch(0.58 0.17 310)`     | `oklch(0.96 0.035 310)` / `0.42 0.15` |
| Past     | 150 | `oklch(0.58 0.14 150)`     | `oklch(0.96 0.04 150)` / `0.38 0.13`  |
| Vendor   | 260 | `oklch(0.55 0.08 260)`     | `oklch(0.95 0.01 260)` / `0.40 0.01`  |
| SOI      | 30  | `oklch(0.62 0.14 30)`      | `oklch(0.96 0.04 30)` / `0.42 0.13`   |

### 2.5 Stage hues (pipeline lanes)

Lanes carry a small color dot, not a full background tint. Order is fixed —
left-to-right is the natural pipeline direction, so hue rotates from cool
gray (uncommitted) through the brand blue (engaged) to green (closed).

| Stage              | Dot       |
| ------------------ | --------- |
| New / Needs        | `#ADB5BD` |
| Contacted / Search | `#74C0FC` |
| Engaged / Offer    | `#339AF0` |
| Nurturing          | `#9775FA` |
| Appt Set / UC      | `#FAB005` |
| Agreement / Closed | `#40C057` |

---

## 3. Typography

Two families, both delivered via Google Fonts. **Inter** for everything,
**JetBrains Mono** for any digit or identifier whose alignment matters.

```
--font: 'Inter', system-ui, -apple-system, sans-serif;
--mono: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
```

Body sits at **14px** on desktop and **15px** on mobile. Letter-spacing is
slightly tightened (-0.005em on body, -0.02em on display) to compensate for
Inter's default tracking.

> **In the build:** Inter and JetBrains Mono are loaded once (self-hosted via
> Vite or a single Google Fonts `<link>`) and registered in Tailwind's
> `fontFamily` as `font-sans` / `font-mono`. The scale below maps to Tailwind
> `fontSize` tokens; `.money`/`.tnum` become a small utility/plugin that sets
> `font-variant-numeric: tabular-nums lining-nums`.

### Scale

| Role                       | Size | Weight | Tracking  | Notes                              |
| -------------------------- | ---- | ------ | --------- | ---------------------------------- |
| Page title (desktop)       | 24   | 700    | -0.02em   | `.page-head h1`                    |
| Page title (mobile)        | 28   | 700    | -0.02em   | `.topbar h1`                       |
| Card / lane header         | 13   | 600    | +0.04em   | All-caps; section eyebrow          |
| Body                       | 14/15| 400/500| -0.005em  | Row title at 600                   |
| Meta / caption             | 12   | 400    | normal    | `--ink-3`                          |
| Eyebrow                    | 10.5 | 600    | +0.06em   | All-caps; sidebar section          |
| Stat value                 | 26   | 700    | -0.025em  | Tabular, mono-aligned              |
| Money                      | —    | 600    | -0.02em   | `.money` class; tabular            |
| Time / countdown / id      | 11   | 500    | 0         | JetBrains Mono                     |

### Numbers

Every digit shown to the user — money, beds, sqft, count badges, DOM,
countdowns, calendar times — uses `font-variant-numeric: tabular-nums
lining-nums` (or the `.tnum` helper). Mixed runs of currency and label use
the `.money` pattern: a muted `$` sym + bold tabular digits.

---

## 4. Layout

### 4.1 Desktop shell

```
┌────────────┬────────────────────────────────────────────────┐
│  Sidebar   │  Topbar  (crumbs · search · saved views · ⊕)   │
│  232 px    ├────────────────────────────────────────────────┤
│            │  Page                                          │
│            │  24 / 28 px padding · scroll within main col   │
└────────────┴────────────────────────────────────────────────┘
```

Sidebar is `--side-w: 232px`; topbar is `--topbar-h: 60px`. Page padding
is `24px 28px 40px`. Cards inside the page wear `--r: 10px`, hairline
border, `--shadow-1`.

### 4.2 Mobile shell (iPhone 15, 393 × 852)

```
┌──────────────────────────┐
│  status spacer  (54 px)  │
├──────────────────────────┤
│  topbar  (title + icon)  │
│  app-scroll              │
│    • section ·············
│    • cards ···············
│  (FAB · bottom-right)    │
│  (action bar · contextual)
├──────────────────────────┤
│  tabbar  (6 cols · blur) │
└──────────────────────────┘
```

The tab bar uses a translucent `color-mix` over `--bg` with
`backdrop-filter: blur(14px)`. The FAB sits at `right: 18px; bottom: 92px`
so it never collides with the tab bar safe area.

### 4.3 Spacing scale

`4 · 8 · 12 · 16 · 18 · 22 · 28 · 40`. Helpers: `.gap-1/2/3/4`,
`.mt-1/2/3/4`, `.px-4`. Use the 4-step jumps for component-internal padding,
the 18/22/28 stops for page-level rhythm.

### 4.4 Radii & elevation

| Token        | Value | Use                                  |
| ------------ | ----- | ------------------------------------ |
| `--r-sm`     | 6 px  | Inputs, chips inside dense rows      |
| `--r`        | 10 px | Cards, buttons, table cells corners  |
| `--r-lg`     | 14 px | Lane columns, action bar, modals     |
| `--shadow-1` | hairline | Resting card / button / topbar    |
| `--shadow-2` | medium   | FAB, action bar, popover           |
| `--shadow-3` | tall     | Dialogs, focus overlay             |

---

## 5. Components

> **In the build, each primitive below is a shared React component** in
> `src/components/ui` (or `components/shared`), built on shadcn/ui + Radix and
> themed with the tokens. The `.class` names are the prototype's reference
> vocabulary; production maps them to components + variants:
>
> | Prototype primitive | Build component (shadcn/Radix base) |
> | ------------------- | ----------------------------------- |
> | `.btn` / `.primary` / `.brand` / `.ghost` / `.sm` | `Button` (variant + size props) |
> | `.icon-btn`, `.fab` | `Button` (`icon` variant) / custom `Fab` |
> | `.card` / `.card-head` / `.card-pad` | `Card` (+ `CardHeader`/`CardContent`) |
> | Stat | `Stat` (shared) — value + delta + recharts spark |
> | `.tbl` | `Table` + `VirtualizedTable` (TanStack Virtual) |
> | Kanban `.lane` / `.kard` | `Board` / `Lane` / `KanbanCard` (dnd-kit) |
> | Badge / Chip / Role / Countdown | `Badge`, `Chip` (ToggleGroup item), `RoleBadge`, `Countdown` |
> | `.seg` | `ToggleGroup` (segmented) |
> | `.progress` / `.steps` | `Progress` / `StageSteps` |
> | Activity timeline | `Timeline` (shared) |
> | Calendar week | `CalendarGrid` (shared) |
> | `.map` | `MapPlaceholder` → real map component when it ships |
> | `.ph` | `Placeholder` (shared) |
> | Modals / bottom sheets | `Dialog` (desktop) / `Sheet` (mobile, vaul) |
>
> Visual specs below are authoritative regardless of component base.

### 5.1 Buttons

`.btn` — 34 px tall, 13 px label, 8 px radius, `--surface` over `--border`.
`.primary` inverts to `--ink`. `.brand` uses `--brand`. `.ghost` is
transparent until hover. `.sm` reduces to 28 px / 12 px label for table
inline actions.

`.icon-btn` — 34 × 34 surface, only an icon, optional red `.dot-badge` in
the top-right for unread / overdue cues.

`.fab` (mobile) — 54 px filled-dark circle with `--shadow-2`; the page's
single "create" affordance, parked above the tab bar.

### 5.2 Cards

```
.card  +  .card-head?  +  .card-pad
```

Card head is an all-caps eyebrow + optional meta on the right, divided
from the body by `--border-2`. Card pad is 18 px. Avoid stacking shadows;
when nesting (e.g. a card inside the page) flatten the inner card to a
border-only treatment.

### 5.3 Stat

A four-row vertical: eyebrow label, big tabular value, a `.delta` line
(success-tone arrow + change), and a 110 × 28 sparkline (rendered with
**recharts** — a minimal `<LineChart>`/`<AreaChart>` with axes and grid
stripped, or a lightweight inline SVG for the tiniest variants). Stats live in
a 4-up grid on desktop, scroll-snap row of 2 on mobile.

### 5.4 Tables

```
.tbl
  thead  th        — eyebrow, sticky, sunk bg, 10/14 padding
  tbody  td        — 12/14 padding, hairline divider
                     .name → primary ink, weight 600
                     .sub  → meta line
                     .num  → right-aligned tabular
  tr[data-selected]→ brand-soft fill
```

Rows hover to `--bg-sunk`. Selection is a `--brand-soft` fill with a
3px inset brand bar on the left edge (see `.lrow[data-selected]`).

### 5.5 Kanban

Lane column is 290 px wide, `--r-lg` radius, `--bg` over hairline border.
Head: name (caps), count, money sum on the right. Body: 8 px padded
vertical stack of `.kard` items — surface white, 10 px radius, 12 px
padding, single name + sub + foot row with role chip + countdown. A
dashed `.lane-add` lives at the bottom for "+ Add lead".

On mobile the same data renders as `.lane` (single full-width card) with
`.lane-body` rows separated by 1 px `--border-2` gutters — the lanes
stack vertically and the user scrolls a list, not a board.

### 5.6 Badges, chips, roles, countdown

- **Badge** — pill, 11 px, soft tinted bg. Variants: `brand`, `warn`,
  `danger`, `success`, `info`, `solid` (inverted ink).
- **Chip** — interactive filter pill in the chips row. Active state
  inverts to `--ink`/white.
- **Role** — all-caps 10.5 px pill with a 6 px leading dot. Strictly used
  for contact role (buyer/seller/past/vendor/soi).
- **Countdown** — mono-numeric pill: `ok` (>24h), `warn` (within day),
  `danger` (≤60m), `expired` (inverted ink). The same logic powers offer
  expiry and task urgency. In the build this is a shared `Countdown`
  component whose tiering and formatting use **date-fns**; it re-renders on a
  light interval while mounted so the value stays live.

### 5.7 Segmented

`.seg` — pill-shaped two-or-three-option control. Lives in the topbar or
above a list to switch view modes (e.g. **List / Board / Map**).

### 5.8 Progress

Two flavors:

- **Bar** — `.progress > span`: 6 px track, brand fill. For a single
  percent value (lead score, listing readiness).
- **Steps** — `.steps`: N equal-width pips with `.done` / `.cur` states;
  the current pip extrudes a brand circle outline. Use for the buyer or
  seller transaction lifecycle so the agent always knows which milestone
  is next.

### 5.9 Activity timeline

A three-column grid: time (mono), rail (dashed dotted line + pip), body
(who + text). Pip color encodes event class — brand for stage moves,
warn/danger for missed beats, success for confirmations.

### 5.10 Calendar (week view)

8-column grid: a 56 px time gutter + 7 day columns. Day headers show the
weekday eyebrow + a large number, brand-tinted for "today". Events are
absolutely positioned `.cal-event` blocks with a 3 px brand left bar and
a soft brand bg; `.kind-*` modifiers override the hue for
showing/consult/inspect/call/offer.

### 5.11 Map placeholder

`.map` — a soft radial bg + 40 × 40 dashed grid masked to a vignette,
just enough to read as "a map" without faking real cartography. Pins are
white rounded pills with a 1.5 px ink stroke; the selected pin inverts.
Real map tiles replace this when the design ships.

### 5.12 Image placeholder (`.ph`)

A diagonal warm-stripe with a white-pill `data-label` overlay. Mandatory
for any image the design needs but doesn't yet have — headshots, MLS
photos, hero shots, branded assets. Never hand-draw replacements.

---

## 6. Patterns

### 6.1 Lead vs Client vs Property vs Offer

Four primary records, intentionally distinct shapes so they never confuse:

- **Lead** — a person we haven't committed to. Lives in a Kanban and a
  list. Stage = nurture funnel. Decays out of view at "lost".
- **Client** — a person under contract (representation). Same Kanban
  metaphor but stages mirror the **transaction**, not nurture.
- **Property** — an address. Cross-cuts: a property may have multiple
  offers, multiple showings, one or two clients (buyer + seller).
- **Offer** — a money instrument with an expiry. The countdown rules
  apply most aggressively here.

### 6.2 The "Now" ribbon

On mobile dashboard, the top card is always the next thing happening
(showing, consult, inspection) with a green pulsing dot, minutes-until,
and a "drive time" callout when relevant. If drive ≥ scheduled gap, the
ribbon flips to a warning tone.

### 6.3 Swipe actions (mobile lists)

Rows in tasks and notifications support a left-swipe revealing three
72 px action buttons: **Done** (success), **Reschedule** (info),
**Delete** (destructive). The inner row translates -144 px on open via
`transform`, not `left`, to stay on the GPU.

### 6.4 Master-detail (desktop)

For Leads, Clients, Properties: a `420fr / 1.4fr` split. Left is the
record list with a sticky search/chips header; right is the focused
detail with tabs. Selecting a row brand-soft-fills it; the detail pane
scrolls independently.

### 6.5 Empty states

A short sentence + a single primary action — never an illustration. The
sentence names the agent ("You haven't added any sellers yet") rather
than the system ("No records found"). Tone is matter-of-fact, not
cutesy.

---

## 7. Iconography

Icons come from **lucide-react**. Import per-icon (tree-shaken); render at
24×24 with `strokeWidth={1.6}`, rounded caps and joins (lucide's defaults).
Wrap common usages in a thin `Icon` helper if convenient, but do not maintain
a hand-rolled SVG registry — the prototype's `window.Icon` set is superseded
by the library.

The established vocabulary maps to lucide names (use these unless a screen
clearly needs another): `Home, Users, User, Briefcase, Contact, Calendar,
Check, Map, List, LayoutGrid` (board)`, Plus, Search, Bell, Phone,
MessageSquare, StickyNote` (note)`, PenLine` (pen)`, Share2, ChevronRight,
ChevronDown, MoreHorizontal, Car, Clock, Flame, ArrowUp, ArrowRight, Filter,
SlidersHorizontal, Camera, FileText` (doc)`, Coins, Repeat` (convert).

Rules:
- Icons never carry brand color on rest; they sit at `--ink-3`
  (`text-ink-3`) and shift to `--brand` only when their parent is
  selected/active.
- Never use emoji.
- When an icon would be redundant with its label, drop it.
- Keep the working set small and consistent; don't introduce a second visual
  icon style alongside lucide.

---

## 8. Motion

Motion is restrained — there is no parallax, no springs, no entrances on
load. The only animation primitives are:

- **Tap squish** on touch controls (`active:scale-[0.96]`).
- **Now pulse** on the live ribbon dot: 1.6 s ease-in-out, opacity-only.
- **Swipe reveal**: 180 ms ease-out translateX on the inner row (transform,
  not `left`, to stay on the GPU).
- **Sheet / dialog transitions**: 180 ms slide-up + fade (Radix/vaul
  defaults, tuned). (The prototype's "tweaks panel" was a dev-only affordance
  and does not ship.)

Everything else is instant. The product is a tool; motion is feedback,
not decoration.

---

## 9. Voice & copy

- Sentence case for all titles; ALL CAPS only for eyebrows and badges.
- Numerals: spell out one through nine in prose, digits everywhere a
  human will compare ("$1.2M", "3 overdue").
- Money: always abbreviated above $10k ("$1.05M", "$879k") with no
  trailing zeros. Cents only when the user enters them.
- Time: relative when within 7 days ("Today, 10:30 AM", "Yesterday",
  "Fri Apr 18"); absolute beyond.
- No exclamation marks. The product never celebrates at the user.
- Errors describe the situation, not the violation: "Pre-approval needs
  a lender" over "Field required".

---

## 10. Accessibility

- All interactive elements maintain a 44 × 44 hit target on mobile
  (icon buttons are 36 visible + 8 padding).
- The brand blue passes 4.5:1 against `--bg` and `--surface`.
- Selection state is never color-only — it always pairs with an inset
  bar, border change, or weight shift.
- Tabular numerals + monospaced time mean screen-reader output reads
  the digits in stable order across rows.
- Focus rings inherit from native browser styling on the desktop build;
  they are not suppressed.

---

## 11. File map

The **production build** (this design system's real target) is a single
responsive React + Vite + TS app. One codebase, one route tree; desktop and
mobile diverge only where layout requires it.

```
src/
  main.tsx               · Vite entry
  app/
    App.tsx              · Providers (QueryClient, Auth, Router), root layout
    router.tsx           · React Router v6 route tree (lazy per module)
  styles/
    tokens.css           · ALL --tokens (this doc §2–4) — single source, incl. dark
    globals.css          · base + Tailwind layers
  components/
    ui/                  · shadcn/ui primitives themed with tokens (Button, Card,
                           Table, Badge, Tabs, Progress, Dialog, Sheet, Popover,
                           Command, Tooltip, ToggleGroup …)
    shared/              · cross-surface design components: Money, Countdown,
                           Avatar, StageDot, RoleBadge, TempBadge, Stat, Spark,
                           Timeline, EmptyState, Skeleton, ErrorState, Placeholder
    desktop/             · desktop-only shells (Sidebar, Topbar, MasterDetail)
    mobile/              · mobile-only shells (TabBar, Fab, BottomSheet)
  features/<module>/     · one folder per module (dashboard, leads, clients,
                           contacts, listings, offers, transactions, mls,
                           conversations, calendar, tasks, notes, docs, reports,
                           team, settings) — each with Desktop*/Mobile* views +
                           hooks + local components
  lib/
    ghl/                 · GHL client + typed service modules
    supabase/            · Supabase client + auth
    queryKeys.ts         · centralized TanStack Query keys
  hooks/                 · useSurface(), useBootstrap(), shared hooks
  types/                 · TS types (Zod-inferred)
```

Token edits live in **one** place: `src/styles/tokens.css` (+ the Tailwind
theme that reads it). Both surfaces consume the same variables, so a brand
shift is a single edit; dark mode overrides the same variables under
`[data-theme="dark"]` (§12.1).

---

## 12. Planned features (P3)

The following features are specified for a future sprint. They are referenced
in the Screen Inventory audit (July 1 2026) but not yet implemented.

### 12.1 Dark mode

Dark mode is first-class. Agents use the app in the car at night.

Implementation: a `[data-theme="dark"]` attribute on `<html>` overrides every
`--token` in `src/styles/tokens.css` (Tailwind configured with
`darkMode: ['selector', '[data-theme="dark"]']`). The Settings ▸ Display
screen exposes a Theme control (Light / System / Dark) that sets this
attribute and persists the choice; "System" follows `prefers-color-scheme`.

Dark surface scale (warm-neutral, mirrored):

| Token        | Light                       | Dark                        |
| ------------ | --------------------------- | --------------------------- |
| `--bg`       | `oklch(0.985 0.004 85)`     | `oklch(0.13 0.008 260)`     |
| `--bg-sunk`  | `oklch(0.965 0.005 85)`     | `oklch(0.10 0.008 260)`     |
| `--bg-deep`  | `oklch(0.945 0.006 85)`     | `oklch(0.08 0.007 260)`     |
| `--surface`  | `#ffffff`                   | `oklch(0.17 0.009 260)`     |
| `--border`   | `oklch(0.90 0.006 260)`     | `oklch(0.25 0.010 260)`     |
| `--border-2` | `oklch(0.94 0.005 260)`     | `oklch(0.21 0.009 260)`     |
| `--ink`      | `oklch(0.20 0.015 260)`     | `oklch(0.94 0.008 260)`     |
| `--ink-2`    | `oklch(0.40 0.012 260)`     | `oklch(0.78 0.008 260)`     |
| `--ink-3`    | `oklch(0.58 0.010 260)`     | `oklch(0.58 0.010 260)`     |
| `--ink-4`    | `oklch(0.72 0.008 260)`     | `oklch(0.40 0.008 260)`     |
| `--brand`    | `oklch(0.54 0.165 254)`     | `oklch(0.62 0.155 254)`     |

The brand blue lightens slightly in dark mode to maintain 4.5:1 contrast
against the dark surface. Semantic tokens (`--success`, `--warning`,
`--destructive`) keep their hue and chroma; only lightness shifts +0.08.

### 12.2 Desktop — Command palette (⌘K)

A centered overlay (`max-width: 600px`, `--shadow-3`, `--r-lg`) triggered by
`⌘K` or clicking the topbar search field, built on the shadcn **Command**
component (cmdk). Two sections:

1. **Actions** — keyboard-navigable list: New Lead, New Client, New Property,
   New Offer, New Task, New Note, New Event.
2. **Search results** — live-filtered as the user types, grouped by type
   (Contacts · Properties · Offers · Notes), max 4 results per group.

Selection via arrow keys + Enter; Escape dismisses. The topbar search field
should become a trigger-only affordance once the palette exists (no inline
results in the bar).

### 12.3 Desktop — Global search results overlay

As a lighter alternative to the full command palette: a dropdown beneath the
topbar search field grouped by record type. Same live-filter logic as the
mobile Search screen (`screen-dashboard.jsx`). Keyboard-navigable. Click
outside or Escape dismisses.

### 12.4 Desktop — Offer comparison view

From the Offers table: select 2–5 offers on the same property (checkboxes),
then click **Compare**. Renders a vertical-column comparison layout:

- One column per offer, pinned left: field labels
- Rows: Price · Deposit · Closing date · Irrevocable deadline ·
  Conditions count · Financing · Inspection · Status
- Highest price and shortest closing automatically highlighted with a
  `--brand-soft` fill
- A **Select winner** action per column opens the Offer Detail

### 12.5 Desktop — Negotiation timeline sparkline

Inside Offer Detail → Timeline tab: augment the plain activity feed with a
small price sparkline above the feed. Each counter/revision event plots a
dot at its offered price; the line connects them chronologically. Axis labels
are the original asking price (dashed) and the accepted price (solid
`--success`). Render with **recharts** (or the shared `Spark` component).

### 12.6 Desktop — Calendar conflict detection

In Calendar week view: when two events overlap in the same day column, render
a sticky amber banner at the top of the page:

```
⚠ Thu Apr 17 — 2 overlapping appointments  [Reschedule →]
```

The banner uses `--warning-soft` bg, `--warning` left bar, and links directly
to the day view for that date. Conflict detection runs client-side over the
calendar events query (TanStack Query) for the visible range, recomputed
whenever the week changes.

### 12.7 Desktop — Tasks bulk-edit + mini-calendar scheduler

Two additions to the Tasks screen:

1. **Bulk-edit table view** — a toggle alongside the existing List / Client /
   Property views. Renders a dense editable table: checkbox select-all,
   inline due-date pickers, priority dropdowns, bulk Reschedule / Assign /
   Delete actions in a sticky action bar that appears on first selection.

2. **Mini-calendar scheduler** — a collapsed widget above the task list
   (expand toggle). Shows a 5-day strip with task dots per day. Unscheduled
   tasks appear in a right gutter; drag onto a day to assign a due date.
   Uses the same event data model as the main Calendar.