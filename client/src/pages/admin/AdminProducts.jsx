import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';

const EMPTY = { name: '', description: '', price: '', category: '', stock: '', imageUrl: '' };

export default function AdminProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api.getProducts().then(setProducts).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      category: p.category,
      stock: p.stock,
      imageUrl: p.imageUrl || '',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    try {
      if (editingId) {
        await api.updateProduct(token, editingId, payload);
      } else {
        await api.createProduct(token, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.deleteProduct(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Admin: Products</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
        <input placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="submit">{editingId ? 'Update product' : 'Create product'}</button>
          {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <h2 style={{ marginTop: 24 }}>Catalog</h2>
      <table>
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>${p.price.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td className="row">
                <button type="button" className="secondary" onClick={() => startEdit(p)}>Edit</button>
                <button type="button" className="danger" onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
