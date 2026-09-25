import React from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

export const TopHeader = () => {
  const { currentRole, setCurrentRole } = useStore();

  const roles = [
    { id: 'SELLER', label: 'Ventas' },
    { id: 'MANAGER', label: 'Almacén' },
    { id: 'CASHIER', label: 'Caja' },
    { id: 'ADMIN', label: 'Gerencia' },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-neutral-charcoal text-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-7xl mx-auto px-gutter-desktop flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <img alt="logo" className="h-8 w-auto object-contain bg-white rounded p-1" src="https://lh3.googleusercontent.com/aida/AEtjO1WmBycaYMuGQLI6zee_3pYw3T1580H-w1pad6niCOMcoW2JDkwioszFyTLFJbs52dHwactjXULIQCHkBBTYYY4Zh4g75-VsVA3nwONEnlfON7qPYJx_3B8OO0CUhKJJLW-ID9N8JXBg0jVmAqd5KXSLsm7fFktbc4UhDbpbEqQgP4bPcH_tknw80aHEZWcWlhEtdzVyMre7hejYGFpGJgM3NRCy0UjP3cn1epPR5NKK_V2JuTxMDM1oForGGPu3Pm6FHvPrZ484lOw" />
          <span className="text-headline-md font-headline tracking-tight text-white hidden sm:block">El Castillo - Centro Textil</span>
        </div>
        <nav className="hidden md:flex items-center gap-space-md">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setCurrentRole(role.id)}
              className={`px-space-md py-space-sm transition-colors rounded-lg ${
                currentRole === role.id 
                  ? 'bg-brand-red text-on-primary font-bold' 
                  : 'text-body-md text-secondary-fixed hover:text-white'
              }`}
            >
              {role.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-space-sm">
          <button 
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent hover:border-neutral-border/30 transition-colors group cursor-pointer"
          >
            <span className="text-body-sm font-bold text-white group-hover:text-brand-red hidden sm:block transition-colors">Salir</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:bg-brand-red transition-colors">
              <span className="material-symbols-outlined text-on-primary text-[18px]">logout</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav = () => {
  const { currentRole, setCurrentRole } = useStore();
  
  const roles = [
    { id: 'SELLER', label: 'Ventas', icon: 'storefront' },
    { id: 'MANAGER', label: 'Almacén', icon: 'inventory_2' },
    { id: 'CASHIER', label: 'Caja', icon: 'point_of_sale' },
    { id: 'ADMIN', label: 'Gerencia', icon: 'analytics' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest border-t border-neutral-border z-50 flex items-center justify-around px-space-xs">
      {roles.map(role => {
        const isActive = currentRole === role.id;
        return (
          <button
            key={role.id}
            onClick={() => setCurrentRole(role.id)}
            className={`flex flex-col items-center justify-center flex-1 py-space-xs ${
              isActive 
                ? 'text-brand-red bg-surface-container-high rounded' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
            <span className="text-label-sm">{role.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
