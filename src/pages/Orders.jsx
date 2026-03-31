import React from 'react';
import { useOrdersManager } from '../hooks/useOrdersManager.jsx';
import OrdersUI from '../components/OrdersUI';

const Orders = () => {
  const manager = useOrdersManager();
  return <OrdersUI manager={manager} />;
};

export default Orders;
