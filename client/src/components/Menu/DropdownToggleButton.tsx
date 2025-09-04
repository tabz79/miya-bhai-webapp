import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function DropdownToggleButton({ isOpen, onClick }: DropdownToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all"
      aria-label="Toggle category dropdown"
    >
      <ChevronDown 
        className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
}