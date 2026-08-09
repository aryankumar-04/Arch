# Changelog

All notable changes to the **ARCH** personal operating system dashboard will be documented in this file.

## [1.8.4] - 2026-08-09

### 🎛️ Fully Customizable Dashboard Layouts & Presets
- **Interactive Grid Customization**: Drag, resize, remove, and add widgets dynamically with Undo/Redo history stack, bounded container collision containment, and zero layout overflow.
- **Seeded Baseline "Default" Preset**: Every user gets a seeded, permanent, non-deletable "Default" preset reflecting the original out-of-the-box layout.
- **Custom Named Presets ($\le 10$)**: Create, rename, edit, and switch between up to 10 custom user presets with dynamic active-preset dropdown labels (`📂 WORK MODE ▾`).
- **Layout Uniqueness & Capacity Enforcement**: Prevents duplicate layout configurations with theme-consistent error notifications (`⚠️ DUPLICATE LAYOUT DETECTED`, `⚠️ PRESET LIMIT REACHED (10/10)`).
- **Dual Isolation & Remote Sync**: Per-user `localStorage` caching combined with Firestore document sync (`/users/{userId}/dashboard/...`), strictly isolated per UID with server-side Security Rules (`request.auth.uid == userId`).
- **Edit Mode Navigation Lock**: Global navigation (sidebar tab links, topbar search, logout button) is locked and dimmed (`.nav-locked`) during Edit Mode, displaying warning toasts on click and native `beforeunload` prompts on browser refresh/close.
- **Theme & Accent Color Integration**: All buttons (`✏️ EDIT`, `✓ Done`, `Save Preset`, `+ Create New Preset`), widget remove buttons, resize handles, drag placeholders, and dropdown hover states follow the active theme's accent color (`var(--accent)`), maintaining high contrast and 100% visibility in both Light and Dark themes.

## [1.8.3] - 2026-08-09

### 🎨 Theme-Adaptive Logo & Favicon System
- **High-Contrast Dynamic Favicons**: Implemented dynamic browser & system theme listener (`window.matchMedia('(prefers-color-scheme: dark)')`) for website favicons. Automatically renders `/logo-dark.png` on Light browser tab headers and `/logo-light.png` on Dark browser tab headers for optimal legibility.
- **GitHub README Header Badge**: Updated `README.md` to use GitHub's native theme-adaptive `<picture>` element with `<source media="(prefers-color-scheme)">` rules for crisp rendering in both Light and Dark GitHub modes.

## [1.8.2] - 2026-08-09

### 🎨 Theming & Visual Consistency ("Cyber Black")
- **Dark Theme Inputs & Dropdowns**: Restyled text inputs, search fields, selects, and textareas across Expenses, Coding Hub, Journal, and Analytics to use dark background variables (`var(--bg2)`, `var(--bg4)`) with high-contrast text (`var(--text)`) and distinct placeholder colors (`var(--text2)`).
- **Stat Cards & Charts**: Restyled total spent summary card, budget cap cards, and chart containers to match Cyber Black tokens.
- **Card Hover Animations**: Enabled signature `.card-hover` tactile squish/bounce effect across all card islands in Expenses and Coding Hub tabs.

### 💰 Expenses & Budget Tracker Overhaul
- **Accounting Model Overhaul**: Separated *Spent Money* (`Logged Expenses + Paid Fixed Costs`) from *Allocated Money* (`Savings Contributions`). Savings contributions no longer artificially inflate Total Amount Spent.
- **Segmented Budget Cap Bar**: Upgraded progress bar into 3 proportional visual segments: Logged (`#4F8CC9`), Fixed (`#D69A4A`), and Savings (`#58A77B`), with accurate `% Spent` calculations against the monthly limit.
- **Fixed Expense Cycle Model**: Updated recurring expenses to support calendar cycle tracking (`Paid` vs `Overdue`) with automatic status reset and rollover when new billing cycles begin.
- **Input & Budget Validation**: Added strict validation for non-positive or empty expense entries (`amount <= 0`) and zero/blank budget caps, preventing division-by-zero or `NaN` errors.

### 😴 Daily Journal & Analytics Sleep Tracking
- **24-Hour Sleep Validation**: Real-time validation blocks saving entries if combined `Night Sleep + Evening Nap` exceeds 24.0 hours, displaying a `DuplicateErrorBanner` with title `"SLEEP DURATION EXCEEDED"`.
- **Analytics Chart Baseline & Scaling**: Fixed flexbox alignment in `NeoBarChart` to anchor bars to the 0 baseline. Implemented dynamic auto-scaling with 15% headroom and rounded tick intervals.

### ⚡ Navigation & Modals
- **Direction-Aware Tab Transitions**: Implemented top-to-bottom and bottom-to-top vertical slide animations based on sidebar tab position index with `cubic-bezier(0.16, 1, 0.3, 1)` easing.
- **Tab Auto-Scroll**: Opening a new tab automatically resets the main container scroll position to the top (`scrollTop = 0`).
- **Modal Positioning & Viewport Portals**: Upgraded `Modal`, `GlobalSearchModal`, and `Calendar` modals to use React `createPortal` targeting `document.body`, ensuring perfect viewport centering and clean semi-transparent dark backdrop overlays.

### 🔒 Security & Data Integrity
- **User-Scoped Path Isolation**: Verified all Firestore reads and writes remain strictly scoped to `/users/{userId}/...`.
- **Zero Exposed Secrets**: Confirmed all API keys and config values load securely via `import.meta.env`.
- **Production Build Clean**: Production bundle built cleanly in 750ms with 0 warnings or errors.

## [1.0.5] - 2026-08-04

### 🔒 Security & Environment
- **Environment Key Isolation**: Verified all Firebase credentials, API keys, and endpoints are loaded exclusively via `import.meta.env` from `.env`. Added `.env.example` with environment placeholders.
- **Firestore Security Rules**: Enforced default deny (`match /{document=**} { allow read, write: if false; }`) and strict user path isolation (`/users/{userId}`) so authenticated users can only access their own data.
- **Zero Sensitive Data Logging**: Verified zero exposed `console.log` statements in client source code.

### ⚡ Performance & Perceived Speed
- **Firestore Offline Persistence**: Enabled `enableIndexedDbPersistence(db)` in `firebase.js` for instant local cache hydration across sessions.
- **Real-Time Data Sync**: Upgraded Tasks and Daily Journal stores to real-time `onSnapshot` listeners.
- **In-Memory Store Caching**: Implemented a 5-minute `lastFetched` check across Movies, Wardrobe, and Goals stores to eliminate redundant Firestore reads on tab switches.
- **Optimistic UI & Reconciliation**: Updated all stores (Tasks, Journal, Movies, Wardrobe, Goals, Expenses) to optimistically update UI state immediately, with temporary ID reconciliation to eliminate duplicate document bugs.
- **Button Loading Spinners**: Added inline spinner animations (`.btn-spinner`) and disabled states to form submit buttons.
- **Skeleton Loaders**: Integrated pulsing Skeleton placeholders across Movies grid, Wardrobe grid, Goals categories, Tasks list, Journal sidebar, and Expenses transactions.
- **Batch List Pagination**: Added "Load More" controls for Movies (24/batch), Wardrobe (24/batch), Expenses (30/batch), and Journal (20/batch).

### ✨ Micro-Animations & Motion Design
- **Page Entrance**: 200ms cubic-bezier fade + 10px slide-up transition for all page route changes.
- **Tactile Button Squish**: `:active` press feedback (`transform: scale(0.95)`) across buttons, icon buttons, and mood selectors.
- **Cascading Card Reveals**: Staggered entrance animations for dashboard cards and grid items.
- **Modal Pop-In & Banner Slide-Down**: Smooth scale-up modal entrance and top slide-down warning banners.
- **Accessibility**: Full `@media (prefers-reduced-motion: reduce)` support.

### 🐛 Bug Fixes & Features
- **Duplicate Task Fix**: Resolved race condition between Optimistic UI insertion and `onSnapshot` listener.
- **Evening Nap Tracker**: Added dedicated Evening Nap Tracker to Daily Journal and updated Dashboard sleep totals to reflect combined Night + Nap sleep.
- **Dashboard Task Count Fix**: Updated Dashboard tasks status query to `t.status !== 'completed'`.
- **Goals Category Deletion**: Added inline category deletion for zero-goal categories.
- **Calendar Snap-to-Today**: Navigation to Calendar automatically resets view to real-world current month/year and highlights today.
