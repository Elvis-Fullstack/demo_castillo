import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { BottomNav } from './components/RoleSwitcher';
import { supabase } from './lib/supabase';

// Views
import SellerView from './views/SellerView';
import ManagerView from './views/ManagerView';
import CashierView from './views/CashierView';
import AdminDashboard from './views/AdminDashboard';
import LoginView from './views/LoginView';

import Header from './components/Header';

const AppContent = ({ currentUser, onLogout }) => {
  const { currentRole } = useStore();

  const renderView = () => {
    switch (currentRole) {
      case 'SELLER':
        return <SellerView />;
      case 'MANAGER':
        return <ManagerView />;
      case 'CASHIER':
        return <CashierView />;
      case 'ADMIN':
        return <AdminDashboard />;
      default:
        return <SellerView />;
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={onLogout} />
      <main className="w-full pt-16 pb-16 md:pb-0 flex-1">
        {renderView()}
      </main>
      <BottomNav />
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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
    return <div className="min-h-screen flex items-center justify-center bg-surface text-secondary">Cargando aplicación...</div>;
  }

  if (!session) {
    return <LoginView />;
  }

  const currentUser = session ? {
    name: session.user.user_metadata?.full_name || session.user.email,
    role: session.user.user_metadata?.role || 'seller'
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

export default App;
