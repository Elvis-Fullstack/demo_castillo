import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';

const CashierView = () => {
  const { orders, products, payOrder } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  // Tab state: 'cobrar' or 'pagadas'
  const [activeTab, setActiveTab] = useState('cobrar');

  // Paid orders state
  const [paidSearchTerm, setPaidSearchTerm] = useState('');
  const [expandedPaidOrder, setExpandedPaidOrder] = useState(null);

  // Derived paid orders list, sorted by most recent first
  const paidOrders = useMemo(() => {
    return orders
      .filter(o => o.estado === 'PAGADA')
      .filter(o => {
        if (!paidSearchTerm) return true;
        const term = paidSearchTerm.toLowerCase();
        return (
          (o.id_orden || '').toLowerCase().includes(term) ||
          (o.nombre_vendedora || '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.fecha || b.created_at || 0) - new Date(a.fecha || a.created_at || 0));
  }, [orders, paidSearchTerm]);

  // Paid orders KPIs
  const paidTotal = useMemo(() => {
    return orders
      .filter(o => o.estado === 'PAGADA')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [orders]);

  const paidCount = orders.filter(o => o.estado === 'PAGADA').length;

  const handleSearch = () => {
    const order = orders.find(o => o.id_orden.toUpperCase() === searchTerm.toUpperCase());
    if (order) {
      setCurrentOrder(order);
    } else {
      alert("Orden no encontrada.");
      setCurrentOrder(null);
    }
  };

  const handleProcessPayment = async () => {
    if (currentOrder && currentOrder.estado === 'PENDIENTE') {
      const res = await payOrder(currentOrder.id_orden);
      if (res && res.success) {
        setShowReceipt(true);
        setCurrentOrder({ ...currentOrder, estado: 'PAGADA', fecha: new Date().toISOString() });
      }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    try {
      return new Date(dateStr).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Sin fecha';
    }
  };

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

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('cobrar')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-label-lg font-bold transition-all ${
              activeTab === 'cobrar'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            Cobrar
            {orders.filter(o => o.estado === 'PENDIENTE').length > 0 && (
              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                activeTab === 'cobrar'
                  ? 'bg-on-primary text-primary'
                  : 'bg-brand-red text-on-primary'
              }`}>
                {orders.filter(o => o.estado === 'PENDIENTE').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pagadas')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-label-lg font-bold transition-all ${
              activeTab === 'pagadas'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Órdenes Pagadas
            {paidCount > 0 && (
              <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                activeTab === 'pagadas'
                  ? 'bg-on-primary text-primary'
                  : 'bg-traffic-green text-on-primary'
              }`}>
                {paidCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== TAB: COBRAR ===== */}
      {activeTab === 'cobrar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {/* Left Column: Scanner & Order Retrieval */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Pending Orders Queue */}
            <div className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-neutral-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">pending_actions</span>
                  <h2 className="font-headline text-headline-sm text-on-surface">
                    Órdenes Pendientes por Cobrar
                  </h2>
                  <span className="bg-brand-red/10 text-brand-red font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {orders.filter(o => o.estado === 'PENDIENTE').length} en espera
                  </span>
                </div>
                <span className="text-body-xs text-secondary hidden sm:inline">Selecciona una orden para cargarla en caja</span>
              </div>

              {orders.filter(o => o.estado === 'PENDIENTE').length === 0 ? (
                <div className="py-6 text-center text-secondary bg-surface rounded-lg border border-dashed border-neutral-border">
                  <span className="material-symbols-outlined text-[32px] text-secondary mb-1">done_all</span>
                  <p className="text-body-sm">No hay órdenes pendientes en este momento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {orders
                    .filter(o => o.estado === 'PENDIENTE')
                    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
                    .map((order) => {
                      const isSelected = currentOrder?.id_orden === order.id_orden;
                      const itemsCount = (order.items || []).reduce((sum, item) => sum + (item.cantidad || 1), 0);
                      return (
                        <div
                          key={order.id_orden}
                          onClick={() => {
                            setCurrentOrder(order);
                            setSearchTerm(order.id_orden);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-left ${
                            isSelected
                              ? 'bg-brand-red/10 border-brand-red shadow-sm'
                              : 'bg-surface hover:bg-neutral-50 border-neutral-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-code-num font-bold text-on-surface text-body-md">
                                {order.id_orden}
                              </span>
                              <span className="text-[10px] bg-traffic-yellow-bg text-traffic-yellow font-bold px-1.5 py-0.5 rounded border border-traffic-yellow-border">
                                Pendiente
                              </span>
                            </div>
                            <span className="text-body-xs text-secondary truncate mt-0.5">
                              Vend: <strong className="text-on-surface">{order.nombre_vendedora || 'Mostrador'}</strong> · {itemsCount} art.
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-code-num font-bold text-primary text-body-lg block">
                              ${Number(order.total || 0).toFixed(2)}
                            </span>
                            <span className="text-[11px] text-secondary font-medium">
                              {isSelected ? '✓ Seleccionada' : 'Cobrar →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-surface-container-low rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <label className="font-headline text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">qr_code_scanner</span>
                  O buscar manualmente por código / lector
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-[24px]">search</span>
                  <input 
                    className="w-full pl-12 pr-12 py-3 bg-surface text-on-surface font-code-num text-body-md rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm border border-neutral-border"
                    placeholder="Escanee QR o ingrese código (ej. ORD-8921)"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-1" onClick={() => setSearchTerm('')}>
                    <span className="material-symbols-outlined text-[20px]">backspace</span>
                  </button>
                </div>
                <button onClick={handleSearch} className="bg-primary hover:bg-brand-red-hover text-on-primary font-label-md px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">search</span>
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
                      {(currentOrder.items || []).map((item, idx) => {
                        const itemPrice = Number(item.precio_unitario || item.price || 0);
                        const itemQty = Number(item.cantidad || item.quantity || 1);
                        const product = products.find(p => p.sku === item.sku);
                        const currentStock = product ? (product.stock_sales_floor ?? 0) : 0;
                        const isOutOfStock = currentStock < itemQty;
                        
                        let stockLabel = 'Stock OK';
                        let stockBadgeBg = 'bg-traffic-green-bg';
                        let stockBadgeText = 'text-traffic-green';
                        let stockBadgeBorder = 'border-traffic-green-border';
                        if (isOutOfStock) {
                          stockLabel = 'Sin Stock';
                          stockBadgeBg = 'bg-traffic-red-bg';
                          stockBadgeText = 'text-traffic-red';
                          stockBadgeBorder = 'border-traffic-red-border';
                        } else if (currentStock - itemQty <= 5) {
                          stockLabel = 'Stock Bajo';
                          stockBadgeBg = 'bg-traffic-yellow-bg';
                          stockBadgeText = 'text-traffic-yellow';
                          stockBadgeBorder = 'border-traffic-yellow-border';
                        }

                        return (
                          <tr key={idx} className="hover:bg-surface/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-on-surface">{item.nombre || item.name || 'Producto'}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-code-num text-body-sm text-secondary">SKU: {item.sku}</span>
                                <span className={`${stockBadgeBg} ${stockBadgeText} text-[10px] font-bold px-1.5 py-0.5 rounded border ${stockBadgeBorder}`}>{stockLabel}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-code-num font-bold">{itemQty}</td>
                            <td className="py-3 px-3 text-right font-code-num">${itemPrice.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-code-num font-bold">${(itemQty * itemPrice).toFixed(2)}</td>
                          </tr>
                        );
                      })}
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
      )}

      {/* ===== TAB: ÓRDENES PAGADAS ===== */}
      {activeTab === 'pagadas' && (
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-6">
          
          {/* KPIs Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-neutral-border flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-traffic-green-bg border border-traffic-green-border flex items-center justify-center">
                <span className="material-symbols-outlined text-traffic-green text-[22px]">check_circle</span>
              </div>
              <div>
                <span className="text-label-sm text-secondary uppercase tracking-wider block">Órdenes Cobradas</span>
                <span className="text-headline-lg font-code-num text-on-surface font-bold">{paidCount}</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-neutral-border flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-red-subtle border border-brand-red/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-brand-red text-[22px]">payments</span>
              </div>
              <div>
                <span className="text-label-sm text-secondary uppercase tracking-wider block">Total Recaudado</span>
                <span className="text-headline-lg font-code-num text-on-surface font-bold">${paidTotal.toFixed(2)}</span>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-neutral-border flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[22px]">avg_pace</span>
              </div>
              <div>
                <span className="text-label-sm text-secondary uppercase tracking-wider block">Promedio por Orden</span>
                <span className="text-headline-lg font-code-num text-on-surface font-bold">
                  ${paidCount > 0 ? (paidTotal / paidCount).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-neutral-border">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
              <input
                className="w-full pl-11 pr-4 py-2.5 bg-surface text-on-surface text-body-md rounded-lg border border-neutral-border focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Buscar por código de orden o personal de ventas..."
                value={paidSearchTerm}
                onChange={e => setPaidSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Paid Orders List */}
          {paidOrders.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-10 shadow-sm border border-dashed border-neutral-border text-center">
              <span className="material-symbols-outlined text-[48px] text-secondary mb-2 block">receipt_long</span>
              <h3 className="font-headline text-headline-md text-on-surface mb-1">
                {paidSearchTerm ? 'Sin resultados' : 'No hay órdenes pagadas'}
              </h3>
              <p className="text-body-sm text-secondary">
                {paidSearchTerm
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Las órdenes aparecerán aquí una vez que sean cobradas.'
                }
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paidOrders.map(order => {
                const isExpanded = expandedPaidOrder === order.id_orden;
                const itemsCount = (order.items || []).reduce((sum, item) => sum + (item.cantidad || 1), 0);
                const orderDate = order.fecha || order.created_at;

                return (
                  <div
                    key={order.id_orden}
                    className="bg-surface-container-lowest rounded-xl shadow-sm border border-neutral-border overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Card Header — always visible */}
                    <button
                      onClick={() => setExpandedPaidOrder(isExpanded ? null : order.id_orden)}
                      className="w-full text-left p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Status icon */}
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-traffic-green-bg border border-traffic-green-border flex items-center justify-center">
                          <span className="material-symbols-outlined text-traffic-green text-[20px]">check</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-code-num font-bold text-on-surface text-body-lg">{order.id_orden}</span>
                            <span className="text-[10px] bg-traffic-green-bg text-traffic-green font-bold px-2 py-0.5 rounded border border-traffic-green-border">
                              PAGADA
                            </span>
                          </div>
                          {/* Seller name — prominent */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-secondary text-[14px]">person</span>
                            <span className="text-body-md text-on-surface font-semibold truncate">
                              {order.nombre_vendedora || 'Sin registro'}
                            </span>
                            <span className="text-body-xs text-secondary hidden sm:inline">
                              · {itemsCount} artículo{itemsCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="text-right">
                          <span className="font-code-num font-bold text-primary text-headline-md block">
                            ${Number(order.total || 0).toFixed(2)}
                          </span>
                          <span className="text-body-xs text-secondary">
                            {formatDate(orderDate)}
                          </span>
                        </div>
                        <span className={`material-symbols-outlined text-secondary text-[20px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </div>
                    </button>

                    {/* Expandable Detail */}
                    {isExpanded && (
                      <div className="border-t border-neutral-border bg-surface-container-low">
                        {/* Seller highlight bar */}
                        <div className="px-5 py-3 bg-surface-container-high/50 flex items-center justify-between border-b border-neutral-border">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-primary text-[14px]">person</span>
                            </div>
                            <div>
                              <span className="text-label-sm text-secondary uppercase tracking-wider">Vendedor/a</span>
                              <span className="text-body-md text-on-surface font-bold block -mt-0.5">{order.nombre_vendedora || 'Sin registro'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-label-sm text-secondary uppercase tracking-wider block">Fecha de transacción</span>
                            <span className="text-body-sm text-on-surface font-code-num">{formatDate(orderDate)}</span>
                          </div>
                        </div>

                        {/* Items table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-border text-label-sm text-secondary uppercase">
                                <th className="py-2.5 px-5">Producto</th>
                                <th className="py-2.5 px-3 text-center">Cant.</th>
                                <th className="py-2.5 px-3 text-right">P. Unit.</th>
                                <th className="py-2.5 px-5 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-border text-body-md">
                              {(order.items || []).map((item, idx) => {
                                const qty = Number(item.cantidad || item.quantity || 1);
                                const name = item.nombre || item.name || 'Producto';
                                const price = Number(item.precio_unitario || item.price || 0);
                                return (
                                  <tr key={idx} className="hover:bg-surface/50 transition-colors">
                                    <td className="py-2.5 px-5">
                                      <span className="font-semibold text-on-surface">{name}</span>
                                      <span className="font-code-num text-body-sm text-secondary block">SKU: {item.sku}</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-code-num font-bold">{qty}</td>
                                    <td className="py-2.5 px-3 text-right font-code-num">${price.toFixed(2)}</td>
                                    <td className="py-2.5 px-5 text-right font-code-num font-bold">${(qty * price).toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer total */}
                        <div className="px-5 py-3 border-t border-neutral-border flex items-center justify-between bg-surface-container-high/30">
                          <span className="font-headline text-headline-sm text-on-surface">Total Pagado</span>
                          <span className="font-code-num text-headline-md text-primary font-bold">${Number(order.total || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
                <div className="flex justify-between"><span>Fecha:</span> <span className="text-on-surface">{currentOrder.fecha ? new Date(currentOrder.fecha).toLocaleString() : new Date().toLocaleString()}</span></div>
              </div>
              <div className="py-2 border-t border-b border-neutral-border border-dashed flex flex-col gap-1">
                {(currentOrder.items || []).map((item, idx) => {
                  const qty = Number(item.cantidad || item.quantity || 1);
                  const name = item.nombre || item.name || 'Producto';
                  const price = Number(item.precio_unitario || item.price || 0);
                  return (
                    <div key={idx} className="flex justify-between"><span>{qty}x {name.substring(0, 15)}</span> <span className="text-on-surface">${(qty * price).toFixed(2)}</span></div>
                  );
                })}
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
