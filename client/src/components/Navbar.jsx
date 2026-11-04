import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="row" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', justifyContent: 'space-between' }}>
      <div className="row">
        <Link to="/"><strong>ShopEase</strong></Link>
      </div>
      <div className="row">
        <Link to="/cart">Cart ({count})</Link>
        {user && <Link to="/orders">My Orders</Link>}
        {user?.isAdmin && <Link to="/admin/products">Admin Products</Link>}
        {user?.isAdmin && <Link to="/admin/orders">Admin Orders</Link>}
        {user ? (
          <>
            <span className="muted">{user.name}</span>
            <button type="button" className="secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
