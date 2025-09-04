import React from 'react';
import { Plus } from 'lucide-react';

interface AddToCartButtonProps {
  onAdd: () => void;
  size?: 'sm' | 'md';
}

export function AddToCartButton({ onAdd, size = 'sm' }: AddToCartButtonProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8'
  };

  return (
    <button
      onClick={onAdd}
      className={`
        ${sizeClasses[size]} 
        bg-brand-teak hover:bg-brand-tobacco 
        text-white rounded-full 
        flex items-center justify-center 
        shadow-sm hover:shadow-md 
        transition-all duration-200
      `}
      aria-label="Add to cart"
    >
      <Plus className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
    </button>
  );
}