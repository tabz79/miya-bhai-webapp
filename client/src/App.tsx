import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/faq" component={FAQ} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/confirmation" component={Confirmation} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <MobileFrame>
            <Router />
          </MobileFrame>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
