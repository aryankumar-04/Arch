# Changelog

All notable changes to the **ARCH** personal operating system dashboard will be documented in this file.

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
