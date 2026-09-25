import React from 'react';
import { useStore } from '../context/StoreContext';

export default function Header({ currentUser, onLogout }) {
  const { currentRole, setCurrentRole } = useStore();

  const roleNames = {
    seller: 'Ventas',
    cashier: 'Caja',
    manager: 'Almacén',
    admin: 'Gerencia'
  };

  const areas = [
    { id: 'SELLER', label: 'Ventas' },
    { id: 'MANAGER', label: 'Almacén' },
    { id: 'CASHIER', label: 'Caja' },
    { id: 'ADMIN', label: 'Gerencia' },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-neutral-charcoal shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-neutral-charcoal z-50 fixed top-0 w-full">
      <div className="flex items-center gap-3">
        <img alt="logo" className="h-8 w-auto object-contain bg-white rounded p-1" src="https://lh3.googleusercontent.com/aida/AEtjO1WmBycaYMuGQLI6zee_3pYw3T1580H-w1pad6niCOMcoW2JDkwioszFyTLFJbs52dHwactjXULIQCHkBBTYYY4Zh4g75-VsVA3nwONEnlfON7qPYJx_3B8OO0CUhKJJLW-ID9N8JXBg0jVmAqd5KXSLsm7fFktbc4UhDbpbEqQgP4bPcH_tknw80aHEZWcWlhEtdzVyMre7hejYGFpGJgM3NRCy0UjP3cn1epPR5NKK_V2JuTxMDM1oForGGPu3Pm6FHvPrZ484lOw" />
        <h1 className="text-xl font-headline font-bold tracking-tight text-white hidden sm:block">El Castillo - Centro Textil</h1>
      </div>
      
      {/* Navegación para cambiar de vista (áreas) */}
      <nav className="hidden md:flex items-center gap-2">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => setCurrentRole(area.id)}
            className={`px-4 py-2 transition-colors rounded-lg text-sm font-bold ${
              currentRole === area.id 
                ? 'bg-brand-red text-white shadow-sm' 
                : 'text-secondary-fixed hover:text-white hover:bg-white/5'
            }`}
          >
            {area.label}
          </button>
        ))}
      </nav>
      
      {currentUser && (
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <p className="text-body-sm font-bold text-white leading-tight">
              {currentUser.name || 'Usuario'}
            </p>
            <p className="text-label-sm font-medium text-secondary-fixed">
              {roleNames[currentUser.role] || currentUser.role}
            </p>
          </div>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white border border-transparent hover:border-neutral-border/30 rounded-lg transition-colors duration-200 group"
          >
            <span className="hidden sm:inline group-hover:text-brand-red transition-colors">Salir</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:bg-brand-red transition-colors">
              <span className="material-symbols-outlined text-on-primary text-[18px]">logout</span>
            </div>
          </button>
        </div>
      )}
    </header>
  );
}
