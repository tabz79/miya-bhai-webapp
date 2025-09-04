import React from 'react';
import { SearchBarPill } from './SearchBarPill';
import logo from '@/assets/logo.png';

export function Toolbar() {
  return (
    <header className="w-[393px] h-[56px] bg-app-background px-4 flex items-center justify-between">
      {/* Logo - exact Figma specs: 70x44 */}
      <div className="flex-shrink-0">
        <img 
          src={logo} 
          alt="Miya Bhai Food Court" 
          className="w-[70px] h-[44px] object-contain"
        />
      </div>

      {/* Search bar - exact Figma specs: 180x36 */}
      <div className="flex-shrink-0">
        <SearchBarPill />
      </div>
    </header>
  );
}