import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { TopHeader, BottomNav } from './components/RoleSwitcher';

// Views
import SellerView from './views/SellerView';
import ManagerView from './views/ManagerView';
import CashierView from './views/CashierView';
import AdminDashboard from './views/AdminDashboard';

const AppContent = () => {
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
      <TopHeader />
      <main className="w-full pt-16 pb-16 md:pb-0 flex-1">
        {renderView()}
      </main>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
