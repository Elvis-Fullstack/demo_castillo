import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import AddProductForm from '../components/AddProductForm';
import AddEmployeeForm from '../components/AddEmployeeForm';

const ManagerView = () => {
  const { products, replenishStock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transferAmount, setTransferAmount] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddEmployeeForm, setShowAddEmployeeForm] = useState(false);

  const getStatus = (stock, min) => {
    if (stock <= 0) return 'critical';
    if (stock <= min) return 'warning';
    return 'ok';
  };

  const filteredProducts = products.filter(p => {
    const status = getStatus(p.stock_sales_floor, 5); // Assuming 5 as minimum stock for alert
    if (filterPriority === 'critical' && status !== 'critical') return false;
    if (filterPriority === 'warning' && status !== 'warning') return false;
    
    return (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
           (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const sA = getStatus(a.stock_sales_floor, 5);
    const sB = getStatus(b.stock_sales_floor, 5);
    if (sA === 'critical' && sB !== 'critical') return -1;
    if (sB === 'critical' && sA !== 'critical') return 1;
    return 0;
  });

  const criticalCount = products.filter(p => getStatus(p.stock_sales_floor, 5) === 'critical').length;
  const warningCount = products.filter(p => getStatus(p.stock_sales_floor, 5) === 'warning').length;
  const okCount = products.length - criticalCount - warningCount;

  const handleReplenish = () => {
    if (selectedProduct) {
      replenishStock(selectedProduct.id, Number(transferAmount));
      setSelectedProduct(null);
    }
  };

  const handleMassReplenish = async () => {
    if (selectedItems.length === 0) {
      alert("Selecciona al menos un artículo para surtir.");
      return;
    }
    const amount = prompt("Cantidad a transferir para CADA artículo seleccionado:", "10");
    if (amount && !isNaN(amount) && Number(amount) > 0) {
      for (const id of selectedItems) {
        await replenishStock(id, Number(amount));
      }
      setSelectedItems([]);
      alert("¡Surtido masivo completado!");
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)] p-4 md:p-8 pb-20">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-label-sm uppercase tracking-wider text-secondary">Control de Inventario y Logística</span>
          <h1 className="text-headline-xl text-on-surface font-headline">Tablero de Reposición y Pick-List</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Gestión activa de stock crítico para piso de ventas.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-neutral-border">
            <span className="text-label-md text-traffic-red flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-traffic-red animate-pulse"></span> Críticos (Rojos)
            </span>
            <span className="text-headline-lg font-code-num text-on-surface mt-1 block">{criticalCount}</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-neutral-border">
            <span className="text-label-md text-traffic-yellow flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-traffic-yellow"></span> Alertas
            </span>
            <span className="text-headline-lg font-code-num text-on-surface mt-1 block">{warningCount}</span>
          </div>
          <div className="bg-surface-container-low p-3 rounded-lg shadow-sm border border-neutral-border">
            <span className="text-label-md text-traffic-green flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-traffic-green"></span> Óptimos
            </span>
            <span className="text-headline-lg font-code-num text-on-surface mt-1 block">{okCount}</span>
          </div>
        </div>
      </div>

      {/* Filters & Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 md:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="w-full bg-surface-container-low text-on-surface text-body-md rounded-lg pl-10 pr-4 py-2 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="Buscar por SKU, nombre..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-surface-container-low text-on-surface text-body-md rounded-lg px-4 py-2 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary hidden md:block"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="critical">Solo Quiebre (Rojo)</option>
            <option value="warning">Solo Alerta (Amarillo)</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <button 
            onClick={() => { setShowAddForm(!showAddForm); setShowAddEmployeeForm(false); }}
            className="w-full md:w-auto bg-surface-container-high text-on-surface hover:bg-neutral-border px-4 py-2 rounded-lg text-label-lg transition-all flex items-center justify-center gap-2 shadow-sm border border-neutral-border">
            <span className="material-symbols-outlined text-[18px]">{showAddForm ? 'close' : 'add_box'}</span>
            {showAddForm ? 'Cerrar Producto' : 'Nuevo Producto'}
          </button>
          <button 
            onClick={() => { setShowAddEmployeeForm(!showAddEmployeeForm); setShowAddForm(false); }}
            className="w-full md:w-auto bg-surface-container-high text-on-surface hover:bg-neutral-border px-4 py-2 rounded-lg text-label-lg transition-all flex items-center justify-center gap-2 shadow-sm border border-neutral-border">
            <span className="material-symbols-outlined text-[18px]">{showAddEmployeeForm ? 'close' : 'person_add'}</span>
            {showAddEmployeeForm ? 'Cerrar Empleado' : 'Registrar Empleado'}
          </button>
          <button 
            onClick={handleMassReplenish}
            className="w-full md:w-auto bg-primary text-on-primary hover:bg-brand-red-hover px-4 py-2 rounded-lg text-label-lg transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">playlist_add</span>
            Surtir Selección Masiva
          </button>
        </div>
      </div>

      {/* Add Product Form Section */}
      {showAddForm && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <AddProductForm onProductAdded={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Add Employee Form Section */}
      {showAddEmployeeForm && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <AddEmployeeForm onEmployeeAdded={() => setShowAddEmployeeForm(false)} />
        </div>
      )}

      {/* Pick-List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(p => {
          const status = getStatus(p.stock_sales_floor, 5);
          if (status === 'ok') return null; // We typically don't pick-list OK items unless searched

          const isCritical = status === 'critical';
          const titleLabel = isCritical ? 'QUIEBRE CRÍTICO' : 'ALERTA REPOSICIÓN';

          // Use full class names for Tailwind purge compatibility
          const sideBarColor = isCritical ? 'bg-traffic-red' : 'bg-traffic-yellow';
          const badgeBg = isCritical ? 'bg-traffic-red-bg' : 'bg-traffic-yellow-bg';
          const badgeText = isCritical ? 'text-traffic-red' : 'text-traffic-yellow';
          const badgeBorder = isCritical ? 'border-traffic-red-border' : 'border-traffic-yellow-border';
          const dotBg = isCritical ? 'bg-traffic-red' : 'bg-traffic-yellow';
          const stockTextColor = isCritical ? 'text-traffic-red' : 'text-traffic-yellow';

          return (
            <div key={p.id} className={`bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col justify-between border border-neutral-border relative group hover:shadow-md transition-all`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sideBarColor}`}></div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${badgeBg} ${badgeText} border ${badgeBorder} flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotBg} ${isCritical ? 'animate-ping' : ''}`}></span> {titleLabel}
                    </span>
                    <span className="text-code-num text-on-surface-variant">SKU: {p.sku}</span>
                  </div>
                  <h3 className="text-headline-md text-on-surface font-headline mb-1">{p.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low p-3 rounded-lg mb-4 text-body-sm mt-3">
                    <div>
                      <span className="text-on-surface-variant block text-xs">Almacén:</span>
                      <span className="font-bold text-on-surface flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-[16px]">inventory_2</span> {p.stock_warehouse} disp.
                      </span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-xs">Stock / Mínimo:</span>
                      <span className={`font-code-num ${stockTextColor} font-bold text-base mt-0.5`}>{p.stock_sales_floor} und | Mín: 5</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, p.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-neutral-border text-primary focus:ring-primary" 
                    />
                    <span className="text-body-sm text-on-surface-variant">Seleccionar</span>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(p)}
                    className="bg-traffic-green text-on-primary hover:opacity-90 px-4 py-2 rounded-lg text-label-md flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span> Surtir Stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surtir Transfer Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-neutral-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-6 shadow-2xl border border-neutral-border relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-border mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-traffic-green-bg text-traffic-green flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <h2 className="text-headline-md text-on-surface">Transferencia de Stock</h2>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface" onClick={() => setSelectedProduct(null)}>
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-surface-container-low p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Artículo:</span>
                  <span className="font-bold text-on-surface">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Destino en Piso:</span>
                  <span className="font-bold text-primary">Piso de Ventas</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Almacén Central:</span>
                  <span className="font-bold text-on-surface">{selectedProduct.stock_warehouse} disponibles</span>
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-1">Cantidad a Transferir</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    max={selectedProduct.stock_warehouse}
                    className="flex-1 bg-surface-container-low text-on-surface text-body-lg font-code-num rounded-lg px-4 py-2 border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary" 
                  />
                  <span className="text-body-md text-on-surface-variant font-bold">Und.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-border">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low border border-neutral-border transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReplenish}
                disabled={selectedProduct.stock_warehouse === 0}
                className="bg-traffic-green text-on-primary hover:opacity-90 px-6 py-2 rounded-lg text-label-lg transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:grayscale"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Confirmar Envío a Piso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerView;
