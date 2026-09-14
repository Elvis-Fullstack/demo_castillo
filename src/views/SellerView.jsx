import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { QRCodeSVG } from 'qrcode.react';

const SellerView = () => {
  const { products, createOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Hilos', label: 'Hilos' },
    { id: 'Agujas', label: 'Agujas' },
    { id: 'Botones', label: 'Botones' },
    { id: 'Accesorios', label: 'Accesorios' },
    { id: 'Corte', label: 'Corte' },
  ];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categoria === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (sku) => {
    const item = cart.find(i => i.sku === sku);
    return item ? item.cantidad : 0;
  };

  const addToCart = (product) => {
    const currentQty = getCartQuantity(product.sku);
    if (product.stock_piso - currentQty <= 0) return; 

    setCart(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item => item.sku === product.sku ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { sku: product.sku, nombre: product.nombre, cantidad: 1, precio_unitario: product.precio }];
    });
  };

  const removeFromCart = (sku) => {
    setCart(prev => prev.filter(item => item.sku !== sku));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const orderId = await createOrder(cart, total, 'Vendedora (Demo)');
    if (orderId) {
      setGeneratedOrder(orderId);
      setCart([]);
    } else {
      alert("Error al generar la pre-orden");
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
      {/* Top Operational Triage & Status Bar */}
      <div className="bg-surface-container-low px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-traffic-green-bg px-3 py-1 rounded-lg border border-traffic-green-border">
            <span className="w-2.5 h-2.5 rounded-full bg-traffic-green animate-pulse"></span>
            <span className="text-label-sm text-traffic-green font-bold">Caja Activa #4 - Mostrador</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-on-surface-variant text-body-sm">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>Turno: 08:00 - 16:00</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 bg-neutral-charcoal text-white px-3 py-1.5 rounded-lg text-label-md hover:bg-neutral-slate-dark transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span className="hidden sm:inline">Escanear Cámara</span>
          </button>
          <button 
            className="relative flex items-center gap-2 bg-brand-red text-on-primary px-4 py-1.5 rounded-lg text-label-md hover:bg-brand-red-hover transition-all"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          >
            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
            <span className="hidden sm:inline">Pre-Orden</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-traffic-yellow text-on-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Search & Catalog */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-4 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex flex-col gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input 
                className="w-full pl-10 pr-12 py-2.5 bg-surface-container-low rounded-lg text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-brand-red border border-neutral-border"
                type="text"
                placeholder="Buscar por EAN, SKU, Nombre o Referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-secondary hover:text-brand-red transition-colors"
                onClick={() => setShowScanner(true)}
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
            </div>
            
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-label-md transition-all whitespace-nowrap ${
                    categoryFilter === cat.id 
                      ? 'bg-brand-red text-on-primary' 
                      : 'bg-surface-container-high text-on-surface'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md text-on-surface">Catálogo y Disponibilidad</h2>
              <span className="text-body-sm text-on-surface-variant">Mostrando {filteredProducts.length} artículos</span>
            </div>

            {/* Products List */}
            {filteredProducts.map(product => {
              const effectiveStock = product.stock_piso - getCartQuantity(product.codigo_barras);
              const isOutOfStock = effectiveStock <= 0;
              let statusColor = 'traffic-green';
              let statusLabel = 'ADECUADO';
              let borderClass = 'border-traffic-green';

              if (effectiveStock === 0) {
                statusColor = 'traffic-red';
                statusLabel = 'QUIEBRE CRÍTICO';
                borderClass = 'border-traffic-red';
              } else if (effectiveStock <= product.stock_minimo) {
                statusColor = 'traffic-yellow';
                statusLabel = 'ALERTA REPOSICIÓN';
                borderClass = 'border-traffic-yellow';
              }

              return (
                <div key={product.id} className={`bg-white rounded-xl p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 ${borderClass} hover:shadow-md transition-all`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[32px]">inventory_2</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-code-num text-on-surface-variant">SKU: {product.sku}</span>
                        <span className={`bg-${statusColor}-bg border border-${statusColor}-border text-${statusColor} text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1`}>
                          <span className={`w-1.5 h-1.5 rounded-full bg-${statusColor} ${isOutOfStock ? 'animate-ping' : ''}`}></span> {statusLabel}
                        </span>
                      </div>
                      <h3 className="text-body-lg font-headline text-on-surface font-semibold">{product.nombre}</h3>
                      <p className="text-body-sm text-on-surface-variant">Loc: {product.ubicacion.pasillo}-{product.ubicacion.gaveta} | Piso: {effectiveStock}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <span className="text-headline-md text-on-surface font-bold">${product.precio.toFixed(2)}</span>
                    <button 
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product)}
                      className={`px-3.5 py-1.5 rounded-lg text-label-md transition-all flex items-center gap-1.5 ${
                        isOutOfStock 
                          ? 'bg-secondary text-on-secondary hover:bg-neutral-charcoal' 
                          : 'bg-primary text-on-primary hover:bg-brand-red-hover'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <span className="material-symbols-outlined text-[16px]">notifications</span>
                          <span>Sin Stock</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                          <span>Añadir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pre-Order Ticket */}
        <div className="lg:col-span-4 flex flex-col gap-6" id="cart-section">
          <div className="bg-white rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-border pb-3">
              <div>
                <span className="text-label-sm text-secondary uppercase tracking-wider">Ticket Mostrador</span>
                <h2 className="text-headline-lg text-on-surface">
                  {generatedOrder ? `Pre-Orden #${generatedOrder}` : 'Pre-Orden Nueva'}
                </h2>
              </div>
              <span className={`font-bold text-label-md px-2.5 py-1 rounded-lg ${generatedOrder ? 'bg-traffic-green-bg text-traffic-green' : 'bg-brand-red-subtle text-brand-red'}`}>
                {generatedOrder ? 'Generada' : 'En Proceso'}
              </span>
            </div>

            {generatedOrder ? (
              <div className="flex flex-col items-center gap-6 py-6">
                <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center gap-4 border border-neutral-border">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <QRCodeSVG value={generatedOrder} size={160} fgColor="#212529" />
                  </div>
                  <div className="text-center">
                    <p className="text-label-md text-secondary">Código para Cajero</p>
                    <p className="text-headline-lg font-code-num font-bold text-primary mt-1 tracking-widest">{generatedOrder}</p>
                  </div>
                </div>
                
                <p className="text-body-sm text-center text-on-surface-variant">
                  Indíquele este código al cajero o permita que escanee el código QR para proceder con el cobro.
                </p>

                <button 
                  onClick={() => setGeneratedOrder(null)}
                  className="w-full bg-brand-red text-on-primary py-3 rounded-lg text-label-lg font-bold hover:bg-brand-red-hover transition-all shadow-sm"
                >
                  Nueva Pre-Orden
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-6 text-on-surface-variant">Carrito vacío</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.sku} className="flex items-center justify-between bg-surface-container-low p-3 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-body-md font-semibold text-on-surface line-clamp-1">{item.nombre}</span>
                          <span className="text-body-sm text-on-surface-variant">{item.cantidad} und × ${item.precio_unitario.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-code-num font-bold text-on-surface">${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                          <button onClick={() => removeFromCart(item.sku)} className="text-secondary hover:text-error transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-neutral-border">
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="text-code-num text-on-surface">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-body-md text-on-surface-variant">
                    <span>Impuestos (IVA 16%)</span>
                    <span className="text-code-num text-on-surface">${iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-headline-md text-on-surface pt-2 border-t border-dashed border-neutral-border">
                    <span>Total Pre-Orden</span>
                    <span className="text-code-num text-brand-red font-bold text-xl">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <button 
                    disabled={cart.length === 0}
                    onClick={handleCheckout}
                    className="w-full bg-brand-red text-on-primary py-3 rounded-lg text-label-lg font-bold hover:bg-brand-red-hover transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">print</span>
                    <span>Generar Pre-Orden</span>
                  </button>
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => setCart([])}
                    className="w-full bg-surface-container-high text-on-surface py-2 rounded-lg text-label-md hover:bg-secondary-container transition-all disabled:opacity-50"
                  >
                    Limpiar Pre-Orden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-red">qr_code_scanner</span>
                <h3 className="text-headline-md text-on-surface">Escáner</h3>
              </div>
              <button className="text-secondary hover:text-on-surface p-1" onClick={() => setShowScanner(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative w-full h-64 bg-neutral-charcoal rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-brand-red/60">
              <div className="absolute w-48 h-32 border-2 border-traffic-yellow rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-white text-xs bg-black/70 px-2 py-1 rounded">Apunte al Código</span>
              </div>
            </div>
            <button className="w-full bg-secondary text-on-secondary py-2.5 rounded-lg text-label-md hover:bg-neutral-charcoal transition-all" onClick={() => setShowScanner(false)}>
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerView;
