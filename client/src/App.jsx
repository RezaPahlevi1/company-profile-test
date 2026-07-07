import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Link, useParams } from "react-router-dom";
import ScrollToTop from "./components/shared/ScrollToTop";
import useAuthStore from "./store/authStore";
import useAuthVerify from "./hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getPageSettings } from "./api/settings";
import useTrackVisit from "./hooks/useTrackVisit";

const Home = lazy(() => import("./pages/public/Home"));
const About = lazy(() => import("./pages/public/About"));
const Products = lazy(() => import("./pages/public/Products"));
const ProductDetail = lazy(() => import("./pages/public/ProductDetail"));
const Services = lazy(() => import("./pages/public/Services"));
const Blog = lazy(() => import("./pages/public/Blog"));
const BlogDetail = lazy(() => import("./pages/public/BlogDetail"));
const Terms = lazy(() => import("./pages/public/Terms"));
const Contact = lazy(() => import("./pages/public/Contact"));
const Checkout = lazy(() => import("./pages/public/Checkout"));
const OrderStatus = lazy(() => import("./pages/public/OrderStatus"));
const NotFound = lazy(() => import("./pages/public/NotFound"));
const Login = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const ProductList = lazy(() => import("./pages/admin/products/ProductList"));
const ServiceList = lazy(() => import("./pages/admin/services/ServiceList"));
const BlogList = lazy(() => import("./pages/admin/blogs/BlogList"));
const OrderList = lazy(() => import("./pages/admin/orders/OrderList"));
const OrderDetail = lazy(() => import("./pages/admin/orders/OrderDetail"));
const AdminList = lazy(() => import("./pages/admin/settings/AdminList"));
const SiteSettings = lazy(() => import("./pages/admin/settings/SiteSettings"));
const EmailSettings = lazy(
  () => import("./pages/admin/settings/emailSettings"),
);
const CompanyInfo = lazy(() => import("./pages/admin/settings/CompanyInfo"));
const HomeBuilder = lazy(
  () => import("./pages/admin/page-builder/HomeBuilder"),
);
const AboutBuilder = lazy(
  () => import("./pages/admin/page-builder/AboutBuilder"),
);
const PromoSettings = lazy(
  () => import("./pages/admin/settings/PromoSettings"),
);
const TermsSettings = lazy(
  () => import("./pages/admin/settings/TermsSettings"),
);

const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PromoPopup from "./components/shared/PromoPopup";
import useSiteTitle from "./hooks/useSiteTitle";

const PageSpinner = () => (
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

const OrderTrackGuard = ({ children }) => {
  const { orderNumber } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings,
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) return null;

  const pages = data?.data?.data || [];
  const page = pages.find((p) => p.page_key === "order-track");

  // ✅ Cek apakah orderNumber adalah format order number yang valid
  // Format: ORD-YYYYMMDD-XXXXXX (huruf besar, angka, minimal 6 karakter di akhir)
  const isValidOrderNumber = /^ORD-\d{8}-[A-Z0-9]{6,}$/.test(orderNumber || "");

  // Halaman nonaktif tapi ada order number valid → tetap bisa akses
  // (user datang dari link email atau redirect setelah checkout)
  if (page && !page.is_active && !isValidOrderNumber) {
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

// SESUDAH
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, admin, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  // ✅ Tunggu data admin siap DI SINI, sebelum AdminLayout/Sidebar sempat mount.
  // Ini menyatukan gate "hydration" + "data admin" jadi satu spinner,
  // bukan dua tahap terpisah yang bikin sidebar mount kosong lalu terisi.
  if (!admin) return <PageSpinner />;

  return children;
};

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  // ✅ Cukup cek role saja — ProtectedRoute di atasnya sudah menjamin
  // `admin` pasti sudah terisi sebelum titik ini pernah dieksekusi
  const { admin } = useAuthStore();

  if (!allowedRoles.includes(admin.role))
    return <Navigate to="/admin/dashboard" replace />;

  return children;
};

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
    <Footer />
  </>
);

// SESUDAH
function AppInit() {
  useAuthVerify();
  useTrackVisit();

  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) return;
    if (hasPrefetched.current) return;

    hasPrefetched.current = true;
    // .catch diam-diam — kalau prefetch gagal (misal koneksi putus sesaat),
    // React.lazy() akan tetap coba lagi sendiri saat benar-benar dirender
    import("./components/layout/AdminLayout").catch(() => {});
  }, [_hasHydrated, isAuthenticated]);

  return null;
}

export default function App() {
  useSiteTitle();
  return (
    <Suspense fallback={<PageSpinner />}>
      <AppInit />
      <ScrollToTop />
      <Routes>
        {/* Public */}
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
          path="/terms"
          element={
            <PublicLayout>
              <Terms />
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
              <OrderTrackGuard>
                <OrderStatus />
              </OrderTrackGuard>
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

        {/* Admin */}
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
          <Route
            path="settings/company"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <CompanyInfo />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="settings/terms"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <TermsSettings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="promo"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <PromoSettings />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="builder/home"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <HomeBuilder />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="builder/about"
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <AboutBuilder />
              </RoleProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
