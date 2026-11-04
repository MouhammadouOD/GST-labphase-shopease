# ShopEase - Full-Stack E-Commerce Platform

A full-stack e-commerce web application built with the MERN stack (MongoDB,
Express, React, Node.js). Customers can browse a product catalog with search
and category filters, view product details, manage a persistent cart, and
complete a checkout flow. Registered users have order history tied to their
account, and admin accounts can manage the product catalog and view/update
all customer orders.

## Tech stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), JWT authentication (`jsonwebtoken`), `bcryptjs` for password hashing.
- **Frontend**: React (Vite), React Router, Context API for auth and cart state, plain `fetch` for API calls.
- **Testing**: `supertest` + `mongodb-memory-server` for real integration tests against the actual Express app (no mocked database).

## Features

- User registration and login with JWT; `GET /api/auth/me` to fetch the current session user.
- Public product catalog: search by name, filter by category, product detail page.
- Persistent shopping cart (stored in `localStorage`), editable quantities.
- Server-authoritative checkout: prices and stock are re-validated server-side on every order, never trusted from the client. Each order line item snapshots the product's name and price at purchase time, so later catalog edits never rewrite order history.
- Order history for the logged-in customer.
- Role-based access control: an `isAdmin` flag on the user, carried in the JWT and re-verified against the live database record on every admin-gated request (so revoking admin takes effect immediately, not just after the token expires).
- Admin area: full product CRUD (create, update, delete, stock levels) and a view of all customer orders with order status updates (`pending` / `paid` / `shipped` / `cancelled`).

## Project structure

```
models/        Mongoose schemas (User, Product, Order)
middleware/     requireAuth / requireAdmin middleware
routes/         auth, products, orders REST routes
server.js       Express app wiring, static frontend serving
tests.js        22-test integration suite (supertest + mongodb-memory-server)
client/         React (Vite) frontend
```

## Running locally

### Backend

```bash
npm install
cp .env.example .env   # fill in MONGO_URI / JWT_SECRET if needed
npm run dev             # starts the API on PORT (default 5001)
```

Requires a MongoDB instance reachable at `MONGO_URI`. `PORT` defaults to
`5001` instead of the more common `5000` because `5000` is already bound by
macOS's AirPlay Receiver (ControlCenter) on most Macs — using a different
port avoids that conflict out of the box.

### Frontend

```bash
cd client
npm install
npm run dev              # Vite dev server on http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend (see
`client/vite.config.js`), so the two servers talk to each other without any
CORS configuration during development.

### Production build

```bash
cd client && npm run build
```

This outputs `client/dist`, which `server.js` serves as static files and
falls back to for any non-`/api` route (so client-side routing works on a
hard refresh/deep link too).

## Tests

```bash
npm test
```

22 integration tests run against a real (in-memory) MongoDB instance through
the actual Express app — covering registration/login, admin promotion and
re-login, product CRUD and its admin gating, catalog search/category
filters, checkout (success, stock decrement, insufficient-stock rejection),
order isolation between users, and admin order listing/gating.

```
22/22 tests passed.
```

### Mutation test (verifying the tests actually test something)

To confirm the suite would catch a real regression, `requireAdmin` was
temporarily removed from the product-creation route (`POST /api/products`)
and the suite was re-run. Exactly one test failed, as expected:

```
FAIL: creating a product as a non-admin is rejected (403)
  AssertionError: expected true, got false
```

Every other test still passed, since nothing else touches that code path.
The route was then restored and the full suite was re-run, confirming
`22/22 tests passed.` again. This shows the suite discriminates correct
code from a specific, deliberately broken piece of it rather than passing
regardless of what the code does.

## Manual verification

Besides the automated suite, the running app (backend + frontend dev
servers) was exercised end-to-end in a browser: register → browse/search/
filter the catalog → view a product detail page → add items to the cart →
checkout → see the order in order history; and the admin flow: promote a
user to admin, create/edit products, see stock decrement after a real
checkout, view all orders, and update an order's status. One bug was found
and fixed during this pass: the order-history pages were reading an
`item.price` field that doesn't exist on an order line item (the schema
snapshots it as `priceAtPurchase`), which rendered `$NaN` for line subtotals;
both the customer and admin order views were corrected to read
`item.priceAtPurchase`.

## Deployment

See `DEPLOYMENT.md` for the planned deployment steps (MongoDB Atlas +
Render + a static host for the frontend). Deployment itself is a manual
step left to be carried out separately, since it requires creating real
accounts on third-party services.
