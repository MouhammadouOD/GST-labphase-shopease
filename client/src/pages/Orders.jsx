import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myOrders(token)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (orders.length === 0) return <p className="muted">You have no orders yet.</p>;

  return (
    <div>
      <h1>My Orders</h1>
      {orders.map((o) => (
        <div key={o._id} className="card" style={{ marginBottom: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">{new Date(o.createdAt).toLocaleString()}</span>
            <span>{o.status}</span>
          </div>
          <ul>
            {o.items.map((item, idx) => (
              <li key={idx}>{item.name} x {item.quantity} - ${(item.priceAtPurchase * item.quantity).toFixed(2)}</li>
            ))}
          </ul>
          <p><strong>Total: ${o.total.toFixed(2)}</strong></p>
        </div>
      ))}
    </div>
  );
}
