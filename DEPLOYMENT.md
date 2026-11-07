# Deployment plan

**Deployed 07/11/2026**: https://gst-labphase-shopease.onrender.com/ — backend
live on Render, MongoDB Atlas connected. This document describes the steps
taken and the two real issues hit along the way (both fixed, see
Troubleshooting below).

## 1. Database: MongoDB Atlas

1. Create a free-tier cluster at MongoDB Atlas.
2. Create a database user and whitelist the deploying server's IP (or
   `0.0.0.0/0` for simplicity on a free-tier project).
3. Copy the connection string; it becomes `MONGO_URI`.

## 2. Backend: Render (or Railway)

1. Push this repository to GitHub (already done).
2. Create a new Web Service on Render, pointing at this repo.
3. Build command: `npm install && npm run build` (the root `build` script installs and builds `client/` too — see step 3). Start command: `npm start`.
4. Environment variables:
   - `MONGO_URI` - the Atlas connection string from step 1.
   - `JWT_SECRET` - a long random string (generate with e.g. `openssl rand -hex 32`); never reuse the local dev placeholder from `.env.example`.
   - `PORT` - Render sets this automatically; `server.js` already reads `process.env.PORT`.
5. Once deployed, note the backend's public URL (e.g. `https://shopease-api.onrender.com`).

## 3. Frontend

Two options:

**Option A - serve the frontend from the same backend (simplest, chosen here):**
The root `package.json` has a `build` script
(`npm install --prefix client && npm run build --prefix client`) so setting
Render's build command to `npm install && npm run build` produces
`client/dist` in the deployed instance; `server.js` already serves it as
static files and falls back to it for client-side routes. No separate
frontend host needed.

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

**Real cause, confirmed**: Atlas's Network Access (IP whitelist) did not
include Render's outbound IP. Adding `0.0.0.0/0` to Atlas → Network Access
fixed it — the next redeploy connected successfully (`ShopEase API
listening on port ...`, and `GET /` responded instead of hanging/erroring on
`mongoose.connect`).

## Troubleshooting: `{"error":"Not found. Run npm run build in client/..."}` on the live URL (seen 07/11/2026)

Once the database connected, hitting the live URL returned this JSON
instead of the site — `server.js`'s static-file fallback explicitly produces
this message when `client/dist` doesn't exist. Cause: Render's build command
was just `npm install`, which only installs the root (backend) dependencies
and never runs `vite build` inside `client/`.

Fix applied: added a root `build` script
(`npm install --prefix client && npm run build --prefix client`, see step 3
Option A above). Render's build command needs to be `npm install && npm run
build` (not just `npm install`) for this to take effect on the next deploy.
Verified locally: deleted `client/dist`, ran `npm run build` from the repo
root, confirmed it regenerates `client/dist`, then confirmed with a direct
request against the exported Express app (no server needed) that `GET /`
returns `200` with real HTML instead of the 404 JSON fallback.

## 4. Post-deploy checklist

- Confirm `GET /api/health` on the deployed backend returns `{"ok":true}`.
- Register a test account, promote it to admin directly in Atlas
  (`db.users.updateOne({email: "..."}, {$set: {isAdmin: true}})`), and
  confirm the admin product/order views work against the live database.
- Rotate `JWT_SECRET` if it was ever shared anywhere during setup.
