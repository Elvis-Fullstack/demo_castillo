import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// 1. Importamos el componente unificado para mantener la misma lógica en toda la app
import AddEmployeeForm from './AddEmployeeForm';

export default function WorkersManagement() {
  const [workers, setWorkers] = useState([]);

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

  return (
    <div className="p-6 bg-surface-container-lowest rounded-2xl shadow-sm border border-neutral-border space-y-6">
      <div className="border-b border-neutral-border pb-4">
        <h3 className="text-headline-md font-headline text-on-surface">Gestión de Trabajadores</h3>
        <p className="text-body-sm text-secondary">Agrega y administra los roles del personal de El Castillo.</p>
      </div>

      {/* 2. Usamos el componente unificado y pasamos la función fetchWorkers para actualizar la tabla tras el registro */}
      <AddEmployeeForm onEmployeeAdded={fetchWorkers} />

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
                  {/* 3. Se cambia worker.name por worker.full_name ya que esa es la columna en la BD */}
                  <td className="px-6 py-4 whitespace-nowrap text-body-md font-bold text-on-surface">{worker.full_name || worker.name || 'Sin nombre'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-md text-secondary font-code-num">{worker.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-md">
                    <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold uppercase rounded border ${
                      worker.role === 'manager' ? 'bg-primary-fixed text-on-primary-fixed border-on-primary-fixed-variant' :
                      worker.role === 'cashier' ? 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim' : 'bg-traffic-yellow-bg text-traffic-yellow border-traffic-yellow-border'
                    }`}>
                      {worker.role === 'seller' ? 'Ventas' : worker.role === 'cashier' ? 'Caja' : worker.role === 'admin' ? 'Admin' : 'Gerencia'}
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
