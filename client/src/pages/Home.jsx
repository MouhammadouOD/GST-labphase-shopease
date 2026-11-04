import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    api
      .getProducts(params)
      .then((data) => {
        setProducts(data);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div>
      <h1>Catalog</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <div key={p._id} className="card">
              <h3><Link to={`/products/${p._id}`}>{p.name}</Link></h3>
              <p className="muted">{p.category}</p>
              <p>${p.price.toFixed(2)}</p>
              <p className="muted">Stock: {p.stock}</p>
              <button
                type="button"
                disabled={p.stock < 1}
                onClick={() => addToCart(p, 1)}
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
