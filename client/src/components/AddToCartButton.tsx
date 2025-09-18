import React from 'react';
import { MenuItem } from '@/data/mockData';

interface AddToCartButtonProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  className?: string;
  shadow?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  item,
  onAddToCart,
  className = '',
  shadow = true,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item);
  };

  // Subtle shadow unless overridden
  const shadowClass =
    shadow && !className.includes('shadow-') ? 'shadow-sm' : '';

  return (
    <button
      onClick={handleClick}
      className={`
        bg-[#3c3c3b] text-white rounded-full px-3 py-1 
        text-sm font-semibold transition-colors 
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        focus:ring-[#ae905c] hover:bg-[#2e2e2d]
        ${shadowClass} ${className}
      `}
      aria-label={`Add ${item.name || item.title || 'item'} to cart`}
      type="button"
    >
      ADD
    </button>
  );
};

export default AddToCartButton;
