import Index from "./pages/Index";
import Product from "./pages/Product";
import Trial from "./pages/Trial";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Index />,
    },
    {
      path: "/product",
      name: 'product',
      element: <Product />,
    },
    {
      path: "/trial",
      name: 'trial',
      element: <Trial />,
    },
    {
      path: "/login",
      name: 'login',
      element: <Login />,
    },
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;