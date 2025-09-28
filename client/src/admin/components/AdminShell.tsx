import React, { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';

type NavItem = {
  label: string;
  href: string;
  id: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin' },
  { id: 'orders', label: 'Orders', href: '/admin/orders' },
  { id: 'delivery', label: 'Delivery', href: '/admin/delivery' },
  { id: 'drivers', label: 'Drivers', href: '/admin/drivers' },
  { id: 'customers', label: 'Customers', href: '/admin/customers' },
  { id: 'reports', label: 'Reports', href: '/admin/reports' },
  { id: 'settings', label: 'Settings', href: '/admin/settings' },
];

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Desktop-first shell. Keep behavior non-invasive to other pages.
  const [activePath, setActivePath] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/admin'
  );
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const onLocationChange = () => setActivePath(window.location.pathname);
    // Listen to history navigation events
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('pushstate' as any, onLocationChange); // some routers emit custom events
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('pushstate' as any, onLocationChange);
    };
  }, []);

  const isActive = (href: string) => {
    // Treat exact match or prefix match for sections
    if (href === '/admin') return activePath === '/admin' || activePath === '/admin/';
    return activePath === href || activePath.startsWith(href + '/');
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#3c3c3b] text-white transition-all duration-150 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Admin sidebar"
      >
        <div className="h-16 flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Miya Bhai Logo" className={`h-10 ${collapsed ? 'hidden' : ''}`} />
            <span className={`text-sm font-semibold ${collapsed ? 'sr-only' : ''}`}>Miya Bhai Admin</span>
          </div>

          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
            onClick={() => setCollapsed((s) => !s)}
            className="p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              {collapsed ? (
                <path d="M5 10h10v2H5z" />
              ) : (
                <path d="M6 6h8v2H6zM6 10h8v2H6zM6 14h8v2H6z" />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1" role="navigation" aria-label="Main admin navigation">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors truncate ${
                  active
                    ? 'bg-[#ae905c] text-[#3c3c3b] font-semibold'
                    : 'hover:bg-white/5 text-white/90'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {/* Icon placeholder — keep DOM minimal to avoid accidental layout shifts */}
                <span aria-hidden className="w-5 text-center">
                  {item.label[0]}
                </span>
                <span className={`flex-1 ${collapsed ? 'sr-only' : ''}`}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => {
              // Simple sign-out behavior: navigate to /logout — the app's auth layer should handle the rest
              window.location.href = '/logout';
            }}
            className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <span className={`${collapsed ? 'sr-only' : ''}`}>Sign out</span>
            <span aria-hidden className={`inline-block ${collapsed ? '' : 'ml-0'}`}></span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications placeholder */}
            <button
              aria-label="Notifications"
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                title="User menu"
              >
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700">T</div>
                <span className="text-sm text-gray-700">Admin</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.1 1.02l-4.25 4.656a.75.75 0 01-1.1 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-20"
                >
                  <a href="/admin/profile" role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Profile
                  </a>
                  <a href="/admin/settings" role="menuitem" className="block px-4 py-2 text-sm hover:bg-gray-50">
                    Settings
                  </a>
                  <button
                    onClick={() => (window.location.href = '/logout')}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminShell;
