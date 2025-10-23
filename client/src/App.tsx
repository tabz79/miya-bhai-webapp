// client/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileFrame } from "@/components/ui/MobileFrame";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/Home";
import { Menu } from "@/pages/Menu";
import { Cart } from "@/pages/Cart";
import { Profile } from "@/pages/Profile";
import { FAQ } from "@/pages/FAQ";
import { Checkout } from "@/pages/Checkout";
import { Confirmation } from "@/pages/Confirmation";
import { Staff } from "@/pages/Staff";

import AdminDashboard from "@/admin/pages/index";
import AdminOrdersPage from "@/admin/pages/orders";
import AdminDriversPage from "@/admin/pages/drivers";
import AdminDeliveryPage from "@/admin/pages/delivery";
import AdminCustomersPage from "@/admin/pages/customers";
import AdminReportsPage from "@/admin/pages/reports";
import AdminSettingsPage from "@/admin/pages/settings";
import CouponsPage from "@/admin/pages/Coupons";

import MagicLinkRequest from "@/pages/MagicLinkRequest";
import InvalidLink from "@/pages/InvalidLink";
import LoginPage from "@/pages/LoginPage";

import AuthCallback from "@/pages/AuthCallback";

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "@/components/theme-provider"; // 👈 THE MISSING IMPORT

function AppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/drivers" element={<AdminDriversPage />} />
        <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/coupons" element={<CouponsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <MobileFrame>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/magic-link" element={<MagicLinkRequest />} />
        <Route path="/auth/invalid-link" element={<InvalidLink />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MobileFrame>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <BrowserRouter>
            <Toaster />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;