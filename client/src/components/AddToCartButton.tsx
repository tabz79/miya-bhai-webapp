import React from 'react';
import { MenuItem } from '@/data/mockData';

interface AddToCartButtonProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ item, onAddToCart, className }) => {
  const handleClick = () => {
    onAddToCart(item);
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-green-500 text-white rounded-md px-3 py-1 text-sm font-semibold ${className}`}
    >
      ADD
    </button>
  );
};

export default AddToCartButton;
