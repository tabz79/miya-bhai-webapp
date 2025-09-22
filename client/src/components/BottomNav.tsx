// client/src/components/BottomNav.tsx
import React from 'react';
import { Home, Menu, ShoppingCart, User } from 'lucide-react';
import { useRoute, Link } from 'wouter';
import { useCartStore } from '@/hooks/useCartStore';

export function BottomNav() {
  const [isHome] = useRoute('/');
  const [isMenu] = useRoute('/menu');
  const [isCart] = useRoute('/cart');
  const [isProfile] = useRoute('/profile');
  const { items } = useCartStore();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', active: isHome },
    { icon: Menu, label: 'Menu', path: '/menu', active: isMenu },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', active: isCart },
    { icon: User, label: 'Profile', path: '/profile', active: isProfile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[49px] bg-white border-t border-gray-200">
      <div className="w-[393px] mx-auto h-full">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map(({ icon: Icon, label, path, active }) => (
            <Link key={path} href={path}>
              <button
                className={`
                  flex flex-col items-center justify-center p-1 min-w-[70px] relative
                  ${active ? 'text-brand-teak' : 'text-gray-500'}
                  hover:text-brand-teak transition-colors
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{label}</span>
                {label === 'Cart' && items.length > 0 && (
                  <div className="absolute top-0 right-4 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center">
                    {items.length}
                  </div>
                )}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
