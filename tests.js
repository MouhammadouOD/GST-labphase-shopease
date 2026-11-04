require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./server');
const User = require('./models/User');

const TOTAL_TESTS = 22;
let passed = 0;

function check(name, condition) {
  assert.ok(condition, name);
  passed++;
  console.log(`PASS: ${name}`);
}

async function run() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // --- Auth ---
  let res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice', email: 'alice@example.com', password: 'secret123' });
  check('register returns 201 with a token', res.status === 201 && !!res.body.token);
  const aliceToken = res.body.token;
  const aliceId = res.body.user.id;

  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Alice Again', email: 'alice@example.com', password: 'other123' });
  check('registering a duplicate email is rejected (409)', res.status === 409);

  res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'secret123' });
  check('login with correct credentials succeeds', res.status === 200 && !!res.body.token);

  res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'wrong' });
  check('login with wrong password is rejected (401)', res.status === 401);

  // Second regular user, to test order isolation and non-admin rejection.
  res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bob', email: 'bob@example.com', password: 'secret456' });
  const bobToken = res.body.token;

  // Promote Alice to admin directly in the DB (simulating what an
  // operator would do), then force her to log in again so the new token
  // carries the isAdmin claim.
  await User.findByIdAndUpdate(aliceId, { isAdmin: true });
  res = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'secret123' });
  const adminToken = res.body.token;
  check('re-login after promotion returns a token with admin user payload', res.body.user.isAdmin === true);

  res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
  check('GET /api/auth/me returns the current user', res.status === 200 && res.body.user.email === 'alice@example.com');

  // --- Product management (admin-only) ---
  res = await request(app)
    .post('/api/products')
    .send({ name: 'No Auth Keyboard', price: 10, stock: 5 });
  check('creating a product without auth is rejected (401)', res.status === 401);

  res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ name: 'Non-admin Keyboard', price: 10, stock: 5 });
  check('creating a product as a non-admin is rejected (403)', res.status === 403);

  res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Mechanical Keyboard', description: 'Hot-swappable switches', price: 50, stock: 3, category: 'Electronics' });
  check('creating a product as admin returns 201', res.status === 201);
  const productId = res.body._id;

  res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Novel: The Long Walk', price: 12, stock: 10, category: 'books' });
  const bookId = res.body._id;

  res = await request(app).get('/api/products');
  check('GET /api/products lists both created products', res.body.length === 2);

  res = await request(app).get('/api/products?search=keyboard');
  check('GET /api/products?search filters by name', res.body.length === 1 && res.body[0]._id === productId);

  res = await request(app).get('/api/products?category=books');
  check('GET /api/products?category filters by category (case-insensitive)', res.body.length === 1 && res.body[0]._id === bookId);

  res = await request(app).get(`/api/products/${productId}`);
  check('GET /api/products/:id returns the product detail', res.status === 200 && res.body.name === 'Mechanical Keyboard');

  res = await request(app)
    .put(`/api/products/${productId}`)
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ price: 1 });
  check('updating a product as a non-admin is rejected (403)', res.status === 403);

  res = await request(app)
    .put(`/api/products/${productId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ price: 45 });
  check('updating a product as admin succeeds', res.status === 200 && res.body.price === 45);

  // --- Orders / checkout ---
  res = await request(app).post('/api/orders').send({ items: [{ productId, quantity: 1 }] });
  check('checkout without auth is rejected (401)', res.status === 401);

  res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ items: [{ productId, quantity: 2 }] });
  check('checkout with valid stock succeeds (201) with the correct total', res.status === 201 && res.body.total === 90);

  res = await request(app).get(`/api/products/${productId}`);
  check('checkout actually decrements stock in the database', res.body.stock === 1);

  res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${bobToken}`)
    .send({ items: [{ productId, quantity: 5 }] });
  check('checkout beyond available stock is rejected (400), stock unchanged', res.status === 400);

  res = await request(app).get('/api/orders').set('Authorization', `Bearer ${adminToken}`);
  check("a user's order list never includes another user's orders", res.status === 200 && res.body.length === 0);

  res = await request(app).get('/api/orders/all').set('Authorization', `Bearer ${bobToken}`);
  check('a non-admin cannot list all orders (403)', res.status === 403);

  res = await request(app).get('/api/orders/all').set('Authorization', `Bearer ${adminToken}`);
  check("an admin can list every customer's orders", res.status === 200 && res.body.length === 1 && res.body[0].user.email === 'bob@example.com');

  await mongoose.disconnect();
  await mongod.stop();

  assert.strictEqual(passed, TOTAL_TESTS, `expected ${TOTAL_TESTS} passing tests, got ${passed}`);
  console.log(`\n${passed}/${TOTAL_TESTS} tests passed.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
