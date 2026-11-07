# Deployment plan

This project has not been deployed to a live, public URL. Doing so requires
creating real accounts on third-party services (a database host, an app
host), which is a manual step for whoever runs this project to carry out
themselves, not something to do automatically. This document describes the
exact steps to deploy it.

## 1. Database: MongoDB Atlas

1. Create a free-tier cluster at MongoDB Atlas.
2. Create a database user and whitelist the deploying server's IP (or
   `0.0.0.0/0` for simplicity on a free-tier project).
3. Copy the connection string; it becomes `MONGO_URI`.

## 2. Backend: Render (or Railway)

1. Push this repository to GitHub (already done).
2. Create a new Web Service on Render, pointing at this repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Environment variables:
   - `MONGO_URI` - the Atlas connection string from step 1.
   - `JWT_SECRET` - a long random string (generate with e.g. `openssl rand -hex 32`); never reuse the local dev placeholder from `.env.example`.
   - `PORT` - Render sets this automatically; `server.js` already reads `process.env.PORT`.
5. Once deployed, note the backend's public URL (e.g. `https://shopease-api.onrender.com`).

## 3. Frontend

Two options:

**Option A - serve the frontend from the same backend (simplest):**
Run `npm run build` inside `client/` as part of the Render build step
(`npm install && npm run build --prefix client`) so `client/dist` exists in
the deployed instance; `server.js` already serves it as static files and
falls back to it for client-side routes. No separate frontend host needed.

**Option B - separate static host (Vercel/Netlify):**
1. Deploy the `client/` folder to Vercel or Netlify as a static site (build
   command `npm run build`, output directory `dist`).
2. Set an environment variable or small config change so `client/src/api.js`'s
   `BASE` points at the deployed backend URL from step 2 instead of the
   relative `/api` (which only works when frontend and backend share an
   origin, as the local dev proxy does).
3. Configure the host's SPA fallback (serve `index.html` for unknown routes)
   so client-side routes like `/products/:id` work on a direct link or
   refresh.

## Troubleshooting: `tlsv1 alert internal error` connecting to Atlas (seen 07/11/2026)

First real deploy attempt on Render failed at startup with a Mongoose/MongoDB
driver TLS handshake error against the Atlas cluster (`SSL routines:
ssl3_read_bytes:tlsv1 alert internal error`), logged as Node.js **v24.22.1**
(Render's current default, not an LTS release). This is a known class of
issue: newer, non-LTS Node/OpenSSL builds have had TLS session-handling
regressions that break the handshake with Atlas's TLS termination, while
Node's even-numbered LTS releases (18.x/20.x/22.x) are the versions Atlas
and the MongoDB Node driver are actually tested against.

Fix applied: pinned `"engines": {"node": "20.x"}` in `package.json`.
**Verified by redeploy on 07/11/2026, and this hypothesis was wrong**: Render
correctly used Node 20.20.2, and the exact same TLS alert recurred, from the
exact same 3 Atlas shard servers, byte-for-byte identical. Node/OpenSSL
version was never the cause — ruled out.

**Real cause, almost certainly**: Atlas's Network Access (IP whitelist) does
not include Render's outbound IP. Mongoose's own error message says this
directly ("trying to access the database from an IP that isn't
whitelisted"), and an IP rejection on Atlas's shared-tier proxy layer can
surface as a TLS-level alert (what we're seeing) rather than a plain
connection refusal. **Action needed on the Atlas dashboard, not fixable from
this repo**: Atlas → Network Access → Add IP Address → `0.0.0.0/0` (Render's
IP isn't static, so a specific IP won't work reliably). If that doesn't fix
it, double-check `MONGO_URI` on Render is copied byte-for-byte from Atlas
with the password URL-encoded if it contains `@`, `:`, `/`, or `%`.

## 4. Post-deploy checklist

- Confirm `GET /api/health` on the deployed backend returns `{"ok":true}`.
- Register a test account, promote it to admin directly in Atlas
  (`db.users.updateOne({email: "..."}, {$set: {isAdmin: true}})`), and
  confirm the admin product/order views work against the live database.
- Rotate `JWT_SECRET` if it was ever shared anywhere during setup.
