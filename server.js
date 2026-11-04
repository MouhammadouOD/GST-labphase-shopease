require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));

// Serve the React production build in prod; in dev the React app runs on
// its own Vite dev server (port 5173) and proxies /api to this server.
const clientBuildPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found. Run `npm run build` in client/ to serve the frontend here.' });
  });
});

const start = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`ShopEase API listening on port ${port}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = app;
