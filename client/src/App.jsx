import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Products from "./pages/public/Products";
import ProductDetail from "./pages/public/ProductDetail";
import Services from "./pages/public/Services";
import Blog from "./pages/public/Blog";
import BlogDetail from "./pages/public/BlogDetail";
import Contact from "./pages/public/Contact";
import Checkout from "./pages/public/Checkout";
import OrderStatus from "./pages/public/OrderStatus";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/products/ProductList";
import ServiceList from "./pages/admin/services/ServiceList";
import BlogList from "./pages/admin/blogs/BlogList";
import OrderList from "./pages/admin/orders/OrderList";
import OrderDetail from "./pages/admin/orders/OrderDetail";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AdminLayout from "./components/layout/AdminLayout";
import useAuthVerify from "./hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  useAuthVerify();

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <svg
          className="animate-spin h-8 w-8 text-brand-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />;
};

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <About />
          </PublicLayout>
        }
      />
      <Route
        path="/products"
        element={
          <PublicLayout>
            <Products />
          </PublicLayout>
        }
      />
      <Route
        path="/products/:id"
        element={
          <PublicLayout>
            <ProductDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/services"
        element={
          <PublicLayout>
            <Services />
          </PublicLayout>
        }
      />
      <Route
        path="/blog"
        element={
          <PublicLayout>
            <Blog />
          </PublicLayout>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <PublicLayout>
            <BlogDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <Contact />
          </PublicLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <PublicLayout>
            <Checkout />
          </PublicLayout>
        }
      />
      <Route
        path="/order/:orderNumber"
        element={
          <PublicLayout>
            <OrderStatus />
          </PublicLayout>
        }
      />

      {/* Admin routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="services" element={<ServiceList />} />
        <Route path="blogs" element={<BlogList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
