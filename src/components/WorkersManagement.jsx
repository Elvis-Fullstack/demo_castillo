import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function WorkersManagement() {
  const [workers, setWorkers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('seller'); // 'seller', 'cashier', 'manager'
  const [loading, setLoading] = useState(false);

  // Función para obtener los trabajadores desde la tabla 'profiles' en Supabase
  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error('Error al cargar trabajadores:', err.message);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Función para agregar un nuevo trabajador
  const handleAddWorker = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ name, email, role }]);

      if (error) throw error;

      // Limpiar formulario y recargar lista
      setName('');
      setEmail('');
      setRole('seller');
      fetchWorkers();
    } catch (err) {
      console.error('Error al registrar trabajador:', err.message);
      alert('Error al registrar trabajador: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-neutral-border space-y-6">
      <div className="border-b border-neutral-border pb-4">
        <h3 className="text-headline-md font-headline text-on-surface">Gestión de Trabajadores</h3>
        <p className="text-body-sm text-secondary">Agrega y administra los roles del personal de El Castillo.</p>
      </div>

      {/* Formulario de registro */}
      <form onSubmit={handleAddWorker} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-surface-container-low p-4 rounded-xl border border-neutral-border">
        <div>
          <label className="block text-label-md text-on-surface">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 border border-neutral-border rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ej. María Pérez"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface">Correo Electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 mt-1 border border-neutral-border rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="empleado@elcastillo.com"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface">Rol Asignado</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 mt-1 border border-neutral-border rounded-lg bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="seller">Ventas</option>
            <option value="cashier">Caja</option>
            <option value="manager">Gerencia / Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-4 bg-primary text-on-primary text-label-lg font-bold rounded-lg hover:bg-brand-red-hover transition duration-200 disabled:opacity-50 shadow-sm"
        >
          {loading ? 'Guardando...' : 'Agregar Trabajador'}
        </button>
      </form>

      {/* Tabla de visualización de personal */}
      <div className="overflow-x-auto rounded-lg border border-neutral-border">
        <table className="min-w-full divide-y divide-neutral-border">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-6 py-3 text-left text-label-sm text-secondary uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-label-sm text-secondary uppercase tracking-wider">Correo</th>
              <th className="px-6 py-3 text-left text-label-sm text-secondary uppercase tracking-wider">Rol</th>
            </tr>
          </thead>
          <tbody className="bg-surface-container-lowest divide-y divide-neutral-border">
            {workers.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-body-sm text-secondary">
                  No hay trabajadores registrados en la base de datos.
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr key={worker.id || worker.email} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-body-md font-bold text-on-surface">{worker.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-md text-secondary font-code-num">{worker.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-md">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded border ${
                      worker.role === 'manager' ? 'bg-primary-fixed text-on-primary-fixed border-on-primary-fixed-variant' :
                      worker.role === 'cashier' ? 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim' : 'bg-traffic-yellow-bg text-traffic-yellow border-traffic-yellow-border'
                    }`}>
                      {worker.role === 'seller' ? 'Ventas' : worker.role === 'cashier' ? 'Caja' : 'Gerencia'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
