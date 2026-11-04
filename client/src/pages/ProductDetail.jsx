import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="muted">Loading...</p>;

  return (
    <div>
      <p><Link to="/">&larr; Back to catalog</Link></p>
      <h1>{product.name}</h1>
      <p className="muted">{product.category}</p>
      <p>{product.description}</p>
      <p><strong>${product.price.toFixed(2)}</strong></p>
      <p className="muted">Stock: {product.stock}</p>
      <div className="row">
        <input
          type="number"
          min="1"
          max={product.stock}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          style={{ width: 70 }}
        />
        <button
          type="button"
          disabled={product.stock < 1}
          onClick={() => addToCart(product, qty)}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
