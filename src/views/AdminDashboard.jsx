import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import Papa from 'papaparse';
import { Upload, TrendingUp, AlertOctagon, DollarSign, Edit, Trash2, Save, X } from 'lucide-react';
import TrafficLight from '../components/TrafficLight';
import WorkersManagement from '../components/WorkersManagement';

const AdminDashboard = () => {
  const { products, orders, importProducts, updateProduct, deleteProduct } = useStore();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // KPIs
  const totalSales = orders.filter(o => o.estado === 'PAGADA').reduce((sum, o) => sum + o.total, 0);
  const criticalCount = products.filter(p => p.stock_sales_floor === 0).length;
  const warningCount = products.filter(p => p.stock_sales_floor > 0 && p.stock_sales_floor <= p.min_stock_alert).length;

  // Chart Data: Ventas por Vendedor/a
  const salesBySeller = orders.filter(o => o.estado === 'PAGADA').reduce((acc, order) => {
    const existing = acc.find(x => x.name === order.nombre_vendedora);
    if (existing) {
      existing.ventas += order.total;
    } else {
      acc.push({ name: order.nombre_vendedora, ventas: order.total });
    }
    return acc;
  }, []);

  // Chart Data: Stock Distribution
  const stockCategories = products.reduce((acc, p) => {
    let cat = 'Suficiente';
    if (p.stock_sales_floor === 0) cat = 'Agotado';
    else if (p.stock_sales_floor <= p.min_stock_alert) cat = 'Alerta';
    
    const existing = acc.find(x => x.name === cat);
    if (existing) {
      existing.cantidad += 1;
    } else {
      acc.push({ name: cat, cantidad: 1 });
    }
    return acc;
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const newProds = results.data
            .filter(r => r.codigo_barras)
            .map(r => ({
              sku: r.codigo_barras || r.sku || '',
              name: r.nombre || 'Producto Importado',
              description: r.categoria || 'General',
              stock_warehouse: Number(r.stock_almacen) || 0,
              stock_sales_floor: Number(r.stock_piso) || 0,
              min_stock_alert: Number(r.stock_minimo) || 5,
              price: Number(r.precio) || 0,
              cost: Number(r.cost) || 0
            }));
          if (newProds.length > 0) {
            importProducts(newProds);
            alert(`Se importaron ${newProds.length} productos correctamente.`);
          }
        }
      });
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleEditSave = () => {
    updateProduct(editingId, {
      ...editForm,
      price: Number(editForm.price),
      stock_sales_floor: Number(editForm.stock_sales_floor),
      stock_warehouse: Number(editForm.stock_warehouse),
      min_stock_alert: Number(editForm.min_stock_alert)
    });
    setEditingId(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Panel de Gerencia</h2>
          <p className="text-gray-500">Métricas en tiempo real e importación masiva</p>
        </div>
        <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center space-x-2">
          <Upload className="text-indigo-600 w-5 h-5 ml-2" />
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-green-100 rounded-full text-green-600"><DollarSign className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-500 font-medium">Ventas Totales</p>
            <h3 className="text-3xl font-black">${totalSales.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-red-100 rounded-full text-red-600"><AlertOctagon className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-500 font-medium">Quiebres de Stock</p>
            <h3 className="text-3xl font-black">{criticalCount} <span className="text-sm font-normal text-gray-400">productos</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-yellow-100 rounded-full text-yellow-600"><TrendingUp className="w-8 h-8" /></div>
          <div>
            <p className="text-gray-500 font-medium">En Riesgo (Alerta)</p>
            <h3 className="text-3xl font-black">{warningCount} <span className="text-sm font-normal text-gray-400">productos</span></h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Ventas por Vendedor/a</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySeller.length ? salesBySeller : [{ name: 'Sin datos', ventas: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Estado del Inventario (SKUs)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockCategories.length ? stockCategories : [{ name: 'Sin datos', cantidad: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cantidad" stroke="#ec4899" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Master Inventory Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Inventario Maestro ({products.length} productos)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Piso/Almacén</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrafficLight stockPiso={p.stock_sales_floor} stockMinimo={p.min_stock_alert} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.sku}</td>
                  <td className="px-6 py-4">
                    {editingId === p.id ? (
                      <input 
                        className="border p-1 w-full text-sm" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === p.id ? (
                      <input 
                        type="number" className="border p-1 w-20 text-sm" 
                        value={editForm.price} 
                        onChange={e => setEditForm({...editForm, price: e.target.value})}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">${(p.price || 0).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === p.id ? (
                      <div className="flex space-x-2">
                        <input type="number" className="border p-1 w-16 text-sm" placeholder="Piso" value={editForm.stock_sales_floor} onChange={e => setEditForm({...editForm, stock_sales_floor: e.target.value})} />
                        <input type="number" className="border p-1 w-16 text-sm" placeholder="Almacén" value={editForm.stock_warehouse} onChange={e => setEditForm({...editForm, stock_warehouse: e.target.value})} />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900 font-bold">{p.stock_sales_floor} <span className="text-gray-400 font-normal">/ {p.stock_warehouse}</span></span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === p.id ? (
                      <div className="flex space-x-2">
                        <button onClick={handleEditSave} className="text-green-600 hover:text-green-900"><Save className="w-5 h-5"/></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900"><X className="w-5 h-5"/></button>
                      </div>
                    ) : (
                      <div className="flex space-x-4">
                        <button onClick={() => handleEditClick(p)} className="text-indigo-600 hover:text-indigo-900"><Edit className="w-5 h-5"/></button>
                        <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trabajadores */}
      <div className="mt-8">
        <WorkersManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;
