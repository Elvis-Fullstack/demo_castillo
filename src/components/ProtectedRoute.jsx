import React from 'react';
import { canAccessView } from '../utils/permissions';

export default function ProtectedRoute({ userRole, requiredView, children }) {
  // Verificamos si el usuario tiene el permiso
  const hasPermission = canAccessView(userRole, requiredView);

  // Si no tiene permiso, bloqueamos la vista
  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-16 h-16 mb-4 text-2xl font-bold text-red-600 bg-red-100 rounded-full flex items-center justify-center">
          ✕
        </div>
        <h3 className="text-xl font-bold text-gray-800">Acceso Restringido</h3>
        <p className="mt-2 text-gray-500">
          Tu rol ({userRole}) no tiene permisos para ver esta área.
        </p>
      </div>
    );
  }

  // Si tiene permiso, le mostramos el contenido (la vista real)
  return children;
}
