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

    if (product.stock_warehouse < amount) {
      alert("No hay suficiente stock en almacén para esta transferencia.");
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({
        stock_sales_floor: product.stock_sales_floor + amount,
        stock_warehouse: product.stock_warehouse - amount
      })
      .eq('id', id);

    if (error) {
      console.error('Error replenishing stock:', error);
    } else {
      // Registrar el movimiento de inventario para auditoría
      await supabase.from('inventory_movements').insert([{
        product_id: id,
        movement_type: 'TRANSFER',
        quantity: amount,
        from_location: 'warehouse',
        to_location: 'sales_floor',
        notes: 'Transferencia manual a piso de ventas'
      }]);
      fetchProducts();
    }
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

  // Función para cobrar una orden pendiente
  const payOrder = async (orderId) => {
    try {
      // 1. Buscar la orden pendiente en el estado local
      const orderToPay = orders.find(ord => ord.id_orden === orderId);
      if (!orderToPay) {
        throw new Error("No se encontró la orden pendiente.");
      }

      // 2. Verificar el stock disponible antes de proceder al pago
      for (const item of orderToPay.items) {
        const product = products.find(p => p.sku === item.sku);
        
        // Validamos si el producto existe y si hay suficiente stock en piso
        if (!product || product.stock_sales_floor < item.cantidad) {
          throw new Error(`Stock insuficiente para el producto: ${product ? product.name : 'Desconocido'}`);
        }
      }

      // 3. Descontar el stock en la base de datos
      for (const item of orderToPay.items) {
        const product = products.find(p => p.sku === item.sku);
        const newStock = product.stock_sales_floor - item.cantidad;

        // Actualizamos el stock en Supabase
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_sales_floor: newStock })
          .eq('sku', item.sku);

        if (stockError) throw stockError;
      }

      // 4. Cambiar el estado de la orden a 'PAGADA' y registrar fecha
      const { error: orderError } = await supabase
        .from('orders')
        .update({ estado: 'PAGADA', fecha: new Date().toISOString() })
        .eq('id_orden', orderId);

      if (orderError) throw orderError;

      // 5. Actualizar el estado local en React
      fetchProducts();
      fetchOrders();

      return { success: true, message: "¡Orden pagada y guardada con éxito!" };
    } catch (error) {
      console.error("Error al procesar el pago:", error.message);
      alert(`Error procesando venta: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Keep compatibility with frontend that might expect addProduct/updateProduct
  const addProduct = async (product) => {
    const { data, error } = await supabase.from('products').insert([product]).select();
    if (data) fetchProducts();
  };

  const importProducts = async (productsArray) => {
    const { error } = await supabase.from('products').insert(productsArray);
    if (error) {
      console.error('Error importing products:', error);
      alert(`Error al importar: ${error.message}`);
    } else {
      fetchProducts();
    }
  };

  const updateProduct = async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) {
      console.error('Error updating product:', error);
    } else {
      fetchProducts();
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
    } else {
      fetchProducts();
    }
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
      addProduct,
      importProducts,
      updateProduct,
      deleteProduct,
      fetchOrders
    }}>
      {children}
    </StoreContext.Provider>
  );
};


/**
 * Registra un nuevo producto en la base de datos con inventario dual.
 */
export const createProduct = async (productData) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          cost: parseFloat(productData.cost),
          price: parseFloat(productData.price),
          stock_warehouse: parseInt(productData.stock_warehouse || 0),
          stock_sales_floor: parseInt(productData.stock_sales_floor || 0),
          min_stock_alert: parseInt(productData.min_stock_alert || 5)
        }
      ])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (err) {
    console.error('Error al crear el producto:', err.message);
    return { success: false, error: err.message };
  }
};
