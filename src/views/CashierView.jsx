import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

const CashierView = () => {
  const { orders, payOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const handleSearch = () => {
    const order = orders.find(o => o.id_orden.toUpperCase() === searchTerm.toUpperCase());
    if (order) {
      setCurrentOrder(order);
    } else {
      alert("Orden no encontrada.");
      setCurrentOrder(null);
    }
  };

  const handleProcessPayment = () => {
    if (currentOrder && currentOrder.estado === 'PENDIENTE') {
      payOrder(currentOrder.id_orden);
      setShowReceipt(true);
      setCurrentOrder({ ...currentOrder, estado: 'PAGADA' });
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setCurrentOrder(null);
    setSearchTerm('');
    setCashGiven('');
  };

  const iva = currentOrder ? currentOrder.total * 0.16 : 0;
  const subtotal = currentOrder ? currentOrder.total - iva : 0;
  const total = currentOrder ? currentOrder.total : 0;
  
  const cashNum = parseFloat(cashGiven.replace(/,/g, '')) || 0;
  const change = cashNum > total ? cashNum - total : 0;

  return (
    <div className="flex flex-col w-full bg-surface min-h-[calc(100vh-4rem)] pb-20">
      {/* Top Header */}
      <div className="bg-surface-container-high py-3 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
          </div>
          <div>
            <h1 className="font-headline text-headline-md text-on-surface">Terminal de Caja - Centro Textil El Castillo</h1>
            <p className="font-body text-body-sm text-secondary">Cajero Activo: <span className="font-bold text-on-surface">Caja 04</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-surface px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm flex-1 md:flex-initial">
            <span className="material-symbols-outlined text-traffic-green text-[20px]">wifi</span>
            <span className="font-code-num text-body-sm">Sincronizado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Scanner & Order Retrieval */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <label className="font-headline text-headline-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                Búsqueda o Validación de Pre-orden
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[24px]">search</span>
                <input 
                  className="w-full pl-12 pr-12 py-4 bg-surface text-on-surface font-code-num text-body-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  placeholder="Escanee QR o ingrese código (ej. ORD-8921)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-1" onClick={() => setSearchTerm('')}>
                  <span className="material-symbols-outlined text-[20px]">backspace</span>
                </button>
              </div>
              <button onClick={handleSearch} className="bg-primary hover:bg-brand-red-hover text-on-primary font-label-lg px-6 py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {currentOrder && (
            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-border">
                <div>
                  <h2 className="font-headline text-headline-md text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">receipt_long</span>
                    Desglose de Ítems en <span className="text-primary font-code-num">#{currentOrder.id_orden}</span>
                  </h2>
                  <p className="font-body text-body-sm text-secondary">Vendedor: <span className="font-bold text-on-surface">{currentOrder.nombre_vendedora}</span></p>
                </div>
                <span className="bg-traffic-green-bg border border-traffic-green-border text-traffic-green font-label-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-traffic-green animate-pulse"></span>
                  Stock Verificado
                </span>
              </div>
              
              <div className="flex-1 overflow-x-auto mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-border text-label-sm text-secondary uppercase">
                      <th className="py-3 px-3">Artículo & Código</th>
                      <th className="py-3 px-3 text-center">Cant.</th>
                      <th className="py-3 px-3 text-right">Precio Unit.</th>
                      <th className="py-3 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border font-body text-body-md">
                    {currentOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-on-surface">{item.nombre}</div>
                          <div className="font-code-num text-body-sm text-secondary">SKU: {item.sku}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-code-num font-bold">{item.cantidad}</td>
                        <td className="py-3 px-3 text-right font-code-num">${item.precio_unitario.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-code-num font-bold">${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment & Checkout Action */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm flex flex-col gap-6 opacity-100 transition-opacity" style={{ opacity: currentOrder ? 1 : 0.5 }}>
            <h2 className="font-headline text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Resumen de Pago
            </h2>
            
            <div className="grid grid-cols-3 gap-2 bg-surface p-1.5 rounded-xl">
              {['efectivo', 'tarjeta', 'transferencia'].map(m => (
                <button 
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2.5 px-3 rounded-lg font-label-md transition-all text-center capitalize ${paymentMethod === m ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary hover:text-on-surface'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 font-body">
              <div className="flex justify-between text-secondary">
                <span>Subtotal</span>
                <span className="font-code-num text-on-surface">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>IVA (16%)</span>
                <span className="font-code-num text-on-surface">${iva.toFixed(2)}</span>
              </div>
              <div className="h-px bg-neutral-border my-1"></div>
              <div className="flex justify-between items-baseline">
                <span className="font-headline text-headline-lg text-on-surface">Total a Pagar</span>
                <span className="font-code-num text-[32px] font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {paymentMethod === 'efectivo' && currentOrder && (
              <div className="flex flex-col gap-3 pt-3 border-t border-neutral-border">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-on-surface">Efectivo Recibido:</label>
                  <input 
                    className="w-36 px-3 py-2 bg-surface text-on-surface font-code-num text-right font-bold rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary" 
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center bg-surface p-3 rounded-xl">
                  <span className="font-label-md text-secondary">Cambio a Entregar:</span>
                  <span className="font-code-num text-headline-md text-traffic-green font-bold">${change.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              disabled={!currentOrder || currentOrder.estado === 'PAGADA'}
              onClick={handleProcessPayment}
              className="w-full bg-primary hover:bg-brand-red-hover text-on-primary font-headline text-headline-md py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <span>Cobrar y Consolidar Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Digital Ticket Modal */}
      {showReceipt && currentOrder && (
        <div className="fixed inset-0 bg-neutral-charcoal/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 rounded-full bg-traffic-green-bg border border-traffic-green-border text-traffic-green flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[32px]">check</span>
              </div>
              <h2 className="font-headline text-headline-lg text-on-surface">¡Transacción Exitosa!</h2>
              <p className="font-body text-body-sm text-secondary">Inventario rebajado y ticket digital emitido correctamente.</p>
            </div>
            
            <div className="bg-surface-container-low p-4 rounded-xl border border-neutral-border font-code-num text-body-sm flex flex-col gap-2">
              <div className="text-center pb-2 border-b border-neutral-border border-dashed">
                <div className="font-bold text-headline-sm">CENTRO TEXTIL EL CASTILLO</div>
                <div className="text-secondary text-body-xs">Ticket: #{currentOrder.id_orden}</div>
              </div>
              <div className="py-2 flex flex-col gap-1 text-secondary">
                <div className="flex justify-between"><span>Vendedor:</span> <span className="text-on-surface">{currentOrder.nombre_vendedora}</span></div>
                <div className="flex justify-between"><span>Fecha:</span> <span className="text-on-surface">{new Date(currentOrder.fecha).toLocaleString()}</span></div>
              </div>
              <div className="py-2 border-t border-b border-neutral-border border-dashed flex flex-col gap-1">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between"><span>{item.cantidad}x {item.nombre.substring(0, 15)}</span> <span className="text-on-surface">${(item.cantidad * item.precio_unitario).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="pt-2 flex flex-col gap-1">
                <div className="flex justify-between font-bold text-on-surface text-body-lg pt-1"><span>TOTAL PAGADO:</span> <span className="text-primary">${currentOrder.total.toFixed(2)}</span></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={closeReceipt} className="flex-1 bg-surface-container-high hover:bg-neutral-border text-on-surface font-label-lg py-3 rounded-xl transition-all text-center">
                Nueva Venta
              </button>
              <button onClick={() => { alert('Ticket enviado por WhatsApp con éxito.'); closeReceipt(); }} className="flex-1 bg-primary hover:bg-brand-red-hover text-on-primary font-label-lg py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">share</span>
                Enviar Digital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierView;
