import { Routes, Route, Navigate, Link } from "react-router-dom";
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
import NotFound from "./pages/public/NotFound";

import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ProductList from "./pages/admin/products/ProductList";
import ServiceList from "./pages/admin/services/ServiceList";
import BlogList from "./pages/admin/blogs/BlogList";
import OrderList from "./pages/admin/orders/OrderList";
import OrderDetail from "./pages/admin/orders/OrderDetail";
import AdminList from "./pages/admin/settings/AdminList";
import SiteSettings from "./pages/admin/settings/SiteSettings";
import EmailSettings from "./pages/admin/settings/EmailSettings";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AdminLayout from "./components/layout/AdminLayout";
import useAuthVerify from "./hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getPageSettings } from "./api/settings";
import PromoPopup from "./components/shared/PromoPopup";
import useTrackVisit from "./hooks/useTrackVisit";

const PageGuard = ({ pageKey, children }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;

  const pages = data?.data?.data || [];
  const page = pages.find((p) => p.page_key === pageKey);

  if (page && !page.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            Halaman Tidak Tersedia
          </h1>
          <p className="text-slate-500 mt-4">Halaman ini sedang tidak aktif.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Kembali ke Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  useAuthVerify();
  useTrackVisit();

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

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { admin } = useAuthStore();
  const role = admin?.role || "superadmin";
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
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
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <PromoPopup />
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <PageGuard pageKey="about">
                <About />
              </PageGuard>
            </PublicLayout>
          }
        />
        <Route
          path="/products"
          element={
            <PublicLayout>
              <PageGuard pageKey="products">
                <Products />
              </PageGuard>
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
              <PageGuard pageKey="services">
                <Services />
              </PageGuard>
            </PublicLayout>
          }
        />
        <Route
          path="/blog"
          element={
            <PublicLayout>
              <PageGuard pageKey="blog">
                <Blog />
              </PageGuard>
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
              <PageGuard pageKey="contact">
                <Contact />
              </PageGuard>
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
        <Route
          path="/404"
          element={
            <PublicLayout>
              <NotFound />
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
          <Route
            path="dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <Dashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <ProductList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="services"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <ServiceList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="blogs"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin", "admin_konten"]}>
                <BlogList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="settings/email"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <EmailSettings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin", "admin_order"]}>
                <OrderList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin", "admin_order"]}>
                <OrderDetail />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="settings/admins"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <AdminList />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="settings/site"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <SiteSettings />
              </RoleProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
