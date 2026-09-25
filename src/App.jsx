import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginView from './views/LoginView';
import SellerView from './views/SellerView';
import CashierView from './views/CashierView';
import ManagerView from './views/ManagerView';
import AdminDashboard from './views/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { VIEWS, canAccessView } from './utils/permissions';
import { supabase } from './lib/supabase';
import { StoreProvider, useStore } from './context/StoreContext';

function AppContent({ currentUser, onLogout }) {
  const { currentRole, setCurrentRole } = useStore();

  // Convertimos el rol interno de la app (SELLER, MANAGER...) a los VIEWS que definiste
  const viewMap = {
    'SELLER': VIEWS.SELLER,
    'CASHIER': VIEWS.CASHIER,
    'MANAGER': VIEWS.INVENTORY, // Manager en el código viejo era Almacén
    'ADMIN': VIEWS.MANAGER      // Admin en el código viejo era Gerencia
  };

  const currentView = viewMap[currentRole] || VIEWS.SELLER;

  const handleSetView = (view) => {
    if (view === VIEWS.SELLER) setCurrentRole('SELLER');
    if (view === VIEWS.CASHIER) setCurrentRole('CASHIER');
    if (view === VIEWS.INVENTORY) setCurrentRole('MANAGER');
    if (view === VIEWS.MANAGER) setCurrentRole('ADMIN');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header currentUser={currentUser} onLogout={onLogout} />

      {/* Menú de Navegación Condicional */}
      <nav className="flex gap-4 px-6 py-3 bg-white border-b border-gray-200 overflow-x-auto">
        
        {/* Botón de Ventas */}
        {canAccessView(currentUser.role, VIEWS.SELLER) && (
          <button
            onClick={() => handleSetView(VIEWS.SELLER)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ${
              currentView === VIEWS.SELLER ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ventas
          </button>
        )}

        {/* Botón de Caja */}
        {canAccessView(currentUser.role, VIEWS.CASHIER) && (
          <button
            onClick={() => handleSetView(VIEWS.CASHIER)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ${
              currentView === VIEWS.CASHIER ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Caja
          </button>
        )}

        {/* Botón de Almacén */}
        {canAccessView(currentUser.role, VIEWS.INVENTORY) && (
          <button
            onClick={() => handleSetView(VIEWS.INVENTORY)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ${
              currentView === VIEWS.INVENTORY ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Almacén
          </button>
        )}

        {/* Botón de Gerencia */}
        {canAccessView(currentUser.role, VIEWS.MANAGER) && (
          <button
            onClick={() => handleSetView(VIEWS.MANAGER)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap ${
              currentView === VIEWS.MANAGER ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Gerencia
          </button>
        )}
      </nav>

      {/* Vistas Protegidas */}
      <main className="flex-1 p-6">
        {currentView === VIEWS.SELLER && (
          <ProtectedRoute userRole={currentUser.role} requiredView={VIEWS.SELLER}>
            <SellerView />
          </ProtectedRoute>
        )}

        {currentView === VIEWS.CASHIER && (
          <ProtectedRoute userRole={currentUser.role} requiredView={VIEWS.CASHIER}>
            <CashierView />
          </ProtectedRoute>
        )}

        {currentView === VIEWS.INVENTORY && (
          <ProtectedRoute userRole={currentUser.role} requiredView={VIEWS.INVENTORY}>
            <ManagerView />
          </ProtectedRoute>
        )}

        {currentView === VIEWS.MANAGER && (
          <ProtectedRoute userRole={currentUser.role} requiredView={VIEWS.MANAGER}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("Error obteniendo sesión:", error);
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error("Error inesperado obteniendo sesión:", err);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Cargando aplicación...</div>;
  }

  if (!session) {
    return <LoginView />;
  }

  const currentUser = session ? {
    name: session.user.user_metadata?.full_name || session.user.email,
    role: session.user.user_metadata?.role || 'vendedor'
  } : null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <StoreProvider>
      <AppContent currentUser={currentUser} onLogout={handleLogout} />
    </StoreProvider>
  );
}
