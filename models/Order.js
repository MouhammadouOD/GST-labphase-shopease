const mongoose = require('mongoose');

// Each line item snapshots the product's name and price at the moment of
// purchase. Prices and product names can change later, but an order must
// keep showing what the customer actually paid and bought at the time -
// looking that up live from the current Product document would silently
// rewrite history if the price changed afterward.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'cancelled'],
      default: 'paid',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
