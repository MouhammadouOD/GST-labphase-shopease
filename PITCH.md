# ShopEase - Pitch

Online shoppers expect three things from a store: a catalog that's easy to
search, a checkout they can trust, and a clear record of what they bought.
ShopEase delivers all three as a complete, working MERN-stack application.

On the customer side, ShopEase offers a searchable, filterable product
catalog, a persistent cart that survives page reloads, and a checkout flow
that is entirely server-authoritative: prices and stock levels are always
re-checked against the database at the moment of purchase, never trusted
from whatever the browser sends. That means a customer can never accidentally
buy more than what's in stock, and a price shown in the browser can never be
tampered with to pay less at checkout. Every completed order keeps a
permanent snapshot of what was actually bought and at what price, so a
customer's order history stays accurate even if a product is later renamed,
repriced, or removed from the catalog.

On the business side, ShopEase includes a full admin area: creating,
editing, and deleting products with live stock levels, and reviewing every
customer's orders with the ability to move them through a fulfillment
pipeline (pending, paid, shipped, cancelled). Admin access is enforced at
the API level, not just hidden in the UI - every admin action is re-checked
against the live database record for that user, so revoking admin rights
takes effect immediately rather than only once a login token expires.

Under the hood, ShopEase is a clean separation of concerns: a REST API
(Express + MongoDB/Mongoose) that owns all business logic and validation,
and a React frontend (Vite + React Router) that consumes that API through a
small typed client and keeps session/cart state in React Context. The
backend ships with a 22-test integration suite that runs against a real
MongoDB instance (not mocks) and was verified with a mutation test - a
deliberately broken admin check was confirmed to fail exactly the one test
that covers it, proving the suite actually catches regressions rather than
passing by coincidence.

The result is a small but complete and genuinely production-shaped
e-commerce platform: authenticated users, a public catalog, a trustworthy
checkout, persistent order history, and a working admin back-office - built
and tested end to end, not just scaffolded.
