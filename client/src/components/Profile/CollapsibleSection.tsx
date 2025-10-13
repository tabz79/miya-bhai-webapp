import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function CollapsibleSection({ title, children, isOpen, onToggle }: CollapsibleSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        className="w-full flex justify-between items-center p-4 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <h3 className="text-app-foreground font-semibold text-base">{title}</h3>
        <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}