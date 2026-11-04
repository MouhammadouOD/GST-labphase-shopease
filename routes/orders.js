const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Checkout is server-authoritative: it never trusts prices the client's
// cart might send, it re-reads the current price/stock from MongoDB,
// validates every line's stock *before* committing any change (so a
// multi-item order never partially decrements stock then fails), and
// records a priceAtPurchase snapshot per item.
router.post('/', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    const resolved = [];
    for (const { productId, quantity } of items) {
      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ error: 'each item needs a productId and a positive quantity' });
      }
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ error: `Product ${productId} not found` });
      if (product.stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
      }
      resolved.push({ product, quantity });
    }

    for (const { product, quantity } of resolved) {
      product.stock -= quantity;
      await product.save();
    }

    const orderItems = resolved.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      quantity,
      priceAtPurchase: product.price,
    }));
    const total = orderItems.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

    const order = await Order.create({ user: req.userId, items: orderItems, total });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// My order history - only the authenticated user's own orders.
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin view: every order from every customer.
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update order status (e.g. mark as shipped).
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
