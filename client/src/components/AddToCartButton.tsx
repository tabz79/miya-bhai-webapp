import React from 'react';
import { MenuItem } from '@/data/mockData';

interface AddToCartButtonProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ item, onAddToCart, className = '' }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-green-500 text-white rounded-full px-3 py-1 text-sm font-semibold ${className}`}
      aria-label={`Add ${item.name || item.title || 'item'} to cart`}
    >
      ADD
    </button>
  );
};

export default AddToCartButton;
