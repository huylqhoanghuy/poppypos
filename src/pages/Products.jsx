import React from 'react';
import { useProductsManager } from '../hooks/useProductsManager';
import ProductsUI from '../components/ProductsUI';

const Products = () => {
  const manager = useProductsManager();
  return <ProductsUI manager={manager} />;
};

export default Products;
