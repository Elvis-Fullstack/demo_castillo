import React, { useState } from 'react';
import { createProduct } from '../context/StoreContext';

export default function AddProductForm({ onProductAdded }) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost: '',
    price: '',
    stock_warehouse: '',
    stock_sales_floor: '',
    min_stock_alert: 5
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await createProduct(formData);

    if (result.success) {
      setMessage({ type: 'success', text: '¡Producto añadido exitosamente al inventario!' });
      setFormData({
        sku: '',
        name: '',
        description: '',
        cost: '',
        price: '',
        stock_warehouse: '',
        stock_sales_floor: '',
        min_stock_alert: 5
      });
      if (onProductAdded) onProductAdded();
    } else {
      setMessage({ type: 'error', text: `Error: ${result.error}` });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-neutral-border">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Registrar Nuevo Producto (Inventario El Castillo)</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-traffic-green-bg text-traffic-green border border-traffic-green-border' : 'bg-traffic-red-bg text-traffic-red border border-traffic-red-border'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-on-surface">SKU / Código de Barras</label>
          <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Nombre del Producto</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-on-surface">Descripción</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" rows="2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Costo ($)</label>
          <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Precio de Venta ($)</label>
          <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Stock en Almacén</label>
          <input type="number" name="stock_warehouse" value={formData.stock_warehouse} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Stock en Piso de Ventas</label>
          <input type="number" name="stock_sales_floor" value={formData.stock_sales_floor} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-on-surface">Alerta de Stock Mínimo (Semáforo)</label>
          <input type="number" name="min_stock_alert" value={formData.min_stock_alert} onChange={handleChange} required className="mt-1 block w-full md:w-1/2 border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="md:col-span-2 mt-4">
          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-bold p-3 rounded-md hover:bg-brand-red-hover transition shadow-sm disabled:opacity-50">
            {loading ? 'Guardando producto...' : 'Guardar Producto en el Inventario'}
          </button>
        </div>
      </form>
    </div>
  );
}
