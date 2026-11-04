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

## 4. Post-deploy checklist

- Confirm `GET /api/health` on the deployed backend returns `{"ok":true}`.
- Register a test account, promote it to admin directly in Atlas
  (`db.users.updateOne({email: "..."}, {$set: {isAdmin: true}})`), and
  confirm the admin product/order views work against the live database.
- Rotate `JWT_SECRET` if it was ever shared anywhere during setup.
