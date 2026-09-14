import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('SELLER');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchProducts();
    fetchOrders();

    // Subscribe to realtime changes on products
    const productSubscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        fetchProducts();
      })
      .subscribe();

    // Subscribe to realtime changes on orders
    const orderSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
      supabase.removeChannel(orderSubscription);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (data) setProducts(data);
    else console.error('Error fetching products:', error);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*');
    if (data) setOrders(data);
    else console.error('Error fetching orders:', error);
  };

  const replenishStock = async (id, amount) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (product.stock_almacen < amount) {
      alert("No hay suficiente stock en almacén para esta transferencia.");
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({
        stock_piso: product.stock_piso + amount,
        stock_almacen: product.stock_almacen - amount
      })
      .eq('id', id);

    if (error) console.error('Error replenishing stock:', error);
    else fetchProducts(); // Fallback if realtime is slow
  };

  const createOrder = async (cart, total, sellerName) => {
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrder = {
      id_orden: orderId,
      total: total,
      nombre_vendedora: sellerName,
      estado: 'PENDIENTE',
      items: cart
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) {
      console.error('Error creating order:', error);
      return null;
    } else {
      fetchOrders();
      return orderId;
    }
  };

  const payOrder = async (orderId) => {
    const order = orders.find(o => o.id_orden === orderId);
    if (!order) return;

    // First update the order status
    const { error: orderError } = await supabase
      .from('orders')
      .update({ estado: 'PAGADA' })
      .eq('id_orden', orderId);

    if (orderError) {
      console.error('Error paying order:', orderError);
      return;
    }

    // Then decrease stock for each item
    for (const item of order.items) {
      const product = products.find(p => p.sku === item.sku);
      if (product) {
        await supabase
          .from('products')
          .update({ stock_piso: product.stock_piso - item.cantidad })
          .eq('sku', item.sku);
      }
    }
    
    fetchProducts();
    fetchOrders();
  };

  // Keep compatibility with frontend that might expect addProduct/updateProduct
  const addProduct = async (product) => {
    const { data, error } = await supabase.from('products').insert([product]).select();
    if (data) fetchProducts();
  };

  return (
    <StoreContext.Provider value={{
      currentRole,
      setCurrentRole,
      products,
      orders,
      replenishStock,
      createOrder,
      payOrder,
      addProduct
    }}>
      {children}
    </StoreContext.Provider>
  );
};
