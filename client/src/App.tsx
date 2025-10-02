import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function App() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          {isAdminRoute ? (
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/orders" component={AdminOrdersPage} />
              <Route path="/admin/drivers" component={AdminDriversPage} />
              <Route path="/admin/delivery" component={AdminDeliveryPage} />
              <Route path="/admin/customers" component={AdminCustomersPage} />
              <Route path="/admin/reports" component={AdminReportsPage} />
              <Route path="/admin/settings" component={AdminSettingsPage} />
              <Route path="/admin/coupons" component={CouponsPage} />
              <Route component={NotFound} />
            </Switch>
          ) : (
            <MobileFrame>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/menu" component={Menu} />
                <Route path="/cart" component={Cart} />
                <Route path="/profile" component={Profile} />
                <Route path="/faq" component={FAQ} />
                <Route path="/checkout" component={Checkout} />
                <Route path="/confirmation" component={Confirmation} />
                <Route path="/staff" component={Staff} />
                <Route component={NotFound} />
              </Switch>
            </MobileFrame>
          )}
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
export default App; 
