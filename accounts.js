/* ============================================================================
   Voltai toolkit — seed accounts (read-only, bundled with the app).

   These are predefined logins that ship with the deploy. On Vercel the runtime
   filesystem is read-only, so this file cannot be written to from the browser —
   it is the "accounts saved in a file" source. New sign-ups are stored in the
   visitor's localStorage instead (see auth.js).

   NOTE: this is a lightweight, client-side gate for a demo — NOT real security.
   Passwords here are plain in source on purpose (predefined demo credentials).
   Do not put anything sensitive behind it.
   ============================================================================ */
"use strict";

const SEED_ACCOUNTS = [
  { name: "Voltai Demo", email: "demo@voltai.com", password: "voltai2026" },
];

if (typeof window !== "undefined") window.SEED_ACCOUNTS = SEED_ACCOUNTS;
