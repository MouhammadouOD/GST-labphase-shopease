import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const STATUSES = ['pending', 'paid', 'shipped', 'cancelled'];

export default function AdminOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.allOrders(token).then(setOrders).catch((err) => setError(err.message));
  }

  useEffect(load, [token]);

  async function changeStatus(id, status) {
    setError('');
    try {
      await api.updateOrderStatus(token, id, status);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h1>Admin: Orders</h1>
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        orders.map((o) => (
          <div key={o._id} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{o.user?.name} ({o.user?.email})</span>
              <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
            </div>
            <ul>
              {o.items.map((item, idx) => (
                <li key={idx}>{item.name} x {item.quantity} - ${(item.priceAtPurchase * item.quantity).toFixed(2)}</li>
              ))}
            </ul>
            <div className="row">
              <strong>Total: ${o.total.toFixed(2)}</strong>
              <select value={o.status} onChange={(e) => changeStatus(o._id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
