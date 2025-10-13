// client/src/components/BottomNav.tsx
import React from 'react';
import { Home, Menu, ShoppingCart, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCartStore } from '@/hooks/useCartStore';

export function BottomNav() {
  const location = useLocation();
  const { items } = useCartStore();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Menu, label: 'Menu', path: '/menu' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[49px] bg-white border-t border-gray-200">
      <div className="w-[393px] mx-auto h-full">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-1 min-w-[70px] relative ${
                  isActive ? 'text-brand-teak' : 'text-gray-500'
                } hover:text-brand-teak transition-colors`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{label}</span>
              {label === 'Cart' && items.length > 0 && (
                <div className="absolute top-0 right-4 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                  {items.length}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
