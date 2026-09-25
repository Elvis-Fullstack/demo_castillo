import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AddEmployeeForm({ onEmployeeAdded }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'seller'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: formData
      });

      if (error) {
        throw new Error(error.message || 'Error en la petición de registro');
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      setMessage({ type: 'success', text: `¡Empleado ${formData.full_name} registrado exitosamente!` });
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'seller'
      });
      if (onEmployeeAdded) onEmployeeAdded();
    } catch (err) {
      console.error('Error al registrar empleado:', err);
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-neutral-border">
      <h2 className="text-xl font-bold mb-4 text-on-surface">Registrar Nuevo Empleado</h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-traffic-green-bg text-traffic-green border border-traffic-green-border' : 'bg-traffic-red-bg text-traffic-red border border-traffic-red-border'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-on-surface">Nombre Completo</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Correo Electrónico</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface">Contraseña Temporal</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-on-surface">Asignar Rol</label>
          <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-neutral-border rounded-md p-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="seller">Vendedora</option>
            <option value="cashier">Cajera</option>
            <option value="supervisor">Supervisora</option>
            <option value="manager">Gerente / Manager</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="md:col-span-2 mt-4">
          <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary font-bold p-3 rounded-md hover:bg-brand-red-hover transition shadow-sm disabled:opacity-50">
            {loading ? 'Registrando...' : 'Completar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
}
