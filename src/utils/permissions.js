export const VIEWS = {
  SELLER: 'seller',       // Área de Ventas
  CASHIER: 'cashier',     // Área de Caja
  INVENTORY: 'inventory', // Área de Almacén
  MANAGER: 'manager',     // Área de Gerencia 
};

// Configuramos qué roles tienen acceso a qué áreas
export const ROLE_PERMISSIONS = {
  // El vendedor y cajera pueden en ventas y caja
  vendedor: [VIEWS.SELLER, VIEWS.CASHIER],
  seller: [VIEWS.SELLER, VIEWS.CASHIER], 
  cajera: [VIEWS.SELLER, VIEWS.CASHIER],
  cashier: [VIEWS.SELLER, VIEWS.CASHIER],

  // El supervisor puede en ventas, almacén y caja
  supervisor: [VIEWS.SELLER, VIEWS.INVENTORY, VIEWS.CASHIER],
  manager: [VIEWS.SELLER, VIEWS.INVENTORY, VIEWS.CASHIER], 
  
  // El gerente tiene acceso a todas las áreas
  gerente: [VIEWS.SELLER, VIEWS.CASHIER, VIEWS.INVENTORY, VIEWS.MANAGER],
  admin: [VIEWS.SELLER, VIEWS.CASHIER, VIEWS.INVENTORY, VIEWS.MANAGER], 
};

// Función que usaremos para preguntar: "¿Este rol puede ver esta vista?"
export const canAccessView = (userRole, viewName) => {
  if (!userRole) return false;
  // Buscamos la lista de permisos del rol (en minúsculas por seguridad)
  const allowedViews = ROLE_PERMISSIONS[userRole.toLowerCase()] || [];
  return allowedViews.includes(viewName);
};
