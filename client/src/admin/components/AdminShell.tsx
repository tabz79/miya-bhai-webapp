/**
 * ADMIN PANEL — DESKTOP-FIRST ONLY. DO NOT CHANGE OTHER PAGES.
 *
 * This is the main shell for the admin panel. It provides a consistent layout
 * with a sidebar for navigation and a main content area. This component is
 * designed for desktop use and should not affect the mobile-first storefront.
 */

import React from 'react';
import logo from '@/assets/logo.png';

const AdminShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#3c3c3b] text-white flex flex-col">
        <div className="h-16 flex items-center justify-center">
          <img src={logo} alt="Miya Bhai Logo" className="h-10" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          <a href="/admin" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Dashboard</a>
          <a href="/admin/orders" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Orders</a>
          <a href="/admin/delivery" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Delivery</a>
          <a href="/admin/drivers" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Drivers</a>
          <a href="/admin/customers" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Customers</a>
          <a href="/admin/reports" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Reports</a>
          <a href="/admin/settings" className="block px-4 py-2 rounded-md hover:bg-[#ae905c]">Settings</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div>
            {/* User menu, notifications, etc. */}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminShell;