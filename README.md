# Clarity

Clean up your data and get one clear next step for your business. Three screens, nothing else:

1. **Login** — email + password (sign up or log in).
2. **Data Input** — paste or upload a CSV.
3. **Output & Insights** — cleaned data, a data-quality summary, and a recommended next step.

## Stack

- [Next.js](https://nextjs.org) (App Router) for pages + API routes in one app
- File-based user store (`data/users.json`, gitignored) with `bcryptjs` password hashing
- JWT session cookie (`jsonwebtoken`), httpOnly
- `papaparse` for CSV parsing
- Plain CSS, no UI framework

## Running locally

```bash
npm install
cp .env.example .env.local   # set JWT_SECRET to a random string
npm run dev
```

Open http://localhost:3000 — it redirects to `/login`.

## How it works

- **Auth**: `/api/auth/{register,login,logout,me}`. Passwords are hashed with bcrypt; sessions are a signed JWT in an httpOnly cookie. No roles, no password reset, no email verification — just enough to gate the app.
- **Cleaning** (`lib/clean.js`): trims whitespace, drops fully-empty rows, removes exact duplicate rows, and profiles each column (numeric / date / text, missing rate, min/max/avg, top values).
- **Insights** (`lib/insights.js`): a small rule-based engine picks one recommended next step, in priority order — high duplicate rate → fix data entry; a column with heavy missing data → fix collection; stale dates → refresh your data; otherwise, if there's a revenue-like numeric column, it's grouped against a category column to surface your top performer; if the data is already clean, it suggests what to track next.
- Analyzed data is kept in `sessionStorage` between the Data Input and Insights screens — no server-side persistence of uploaded data.

## Notes on scope

This is intentionally minimal: no role permissions, no admin dashboard, no settings screen. The user store is a JSON file, which is fine for local use/demo but should be swapped for a real database before any real deployment.
