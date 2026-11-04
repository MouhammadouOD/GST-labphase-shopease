import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Cart() {
  const { items, removeFromCart, setQuantity, clearCart, total } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  async function checkout() {
    setError('');
    if (!user) {
      navigate('/login');
      return;
    }
    setPlacing(true);
    try {
      await api.checkout(
        token,
        items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <h1>Cart</h1>
        <p className="muted">Your cart is empty. <Link to="/">Browse products</Link></p>
      </div>
    );
  }

  return (
    <div>
      <h1>Cart</h1>
      <table>
        <thead>
          <tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th /></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.productId}>
              <td>{i.name}</td>
              <td>${i.price.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={i.quantity}
                  onChange={(e) => setQuantity(i.productId, Number(e.target.value))}
                  style={{ width: 60 }}
                />
              </td>
              <td>${(i.price * i.quantity).toFixed(2)}</td>
              <td>
                <button type="button" className="secondary" onClick={() => removeFromCart(i.productId)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total: ${total.toFixed(2)}</strong></p>
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={checkout} disabled={placing}>
        {placing ? 'Placing order...' : 'Checkout'}
      </button>
    </div>
  );
}
