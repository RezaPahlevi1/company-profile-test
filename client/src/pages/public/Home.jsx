import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
  Users,
  TrendingUp,
} from "lucide-react";
import { getProducts } from "../../api/products";
import { getServices } from "../../api/services";
import { getBlogs } from "../../api/blogs";
import ProductCard from "../../components/shared/ProductCard";
import ServiceCard from "../../components/shared/ServiceCard";
import BlogCard from "../../components/shared/BlogCard";
import SectionHeader from "../../components/ui/SectionHeader";

// ============================================================
// ANIMATION VARIANTS
// ============================================================
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

// ============================================================
// HERO SECTION
// ============================================================
const HeroSection = ({ siteName }) => (
  <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-slate-900 via-brand-950 to-slate-900">
    {/* Background grid pattern */}
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }}
    />

    {/* Gradient orbs */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl" />

    <div className="container-base section-padding relative z-10 w-full">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-400/30 text-brand-300 text-sm font-medium px-4 py-2 rounded-full mb-8"
        >
          <Zap size={14} />
          Solusi Digital Terpercaya untuk Bisnis Anda
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight"
        >
          Transformasi Digital{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-400 to-cyan-400">
            Bisnis Anda
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-xl mt-6 leading-relaxed max-w-2xl mx-auto"
        >
          Kami menyediakan produk dan layanan digital berkualitas tinggi untuk
          membantu bisnis Anda berkembang di era modern.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link to="/products" className="btn-primary text-base px-8 py-4">
            Lihat Produk Kami
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold text-base transition-colors"
          >
            Hubungi Kami
            <ChevronRight size={18} />
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-slate-500 text-xs">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-0.5 h-8 bg-linear-to-b from-slate-500 to-transparent rounded-full"
        />
      </motion.div>
    </div>
  </section>
);

// ============================================================
// STATS SECTION
// ============================================================
const stats = [
  { value: "50+", label: "Klien Puas", icon: Users },
  { value: "5+", label: "Tahun Pengalaman", icon: TrendingUp },
  { value: "100+", label: "Proyek Selesai", icon: Zap },
  { value: "99%", label: "Tingkat Kepuasan", icon: Shield },
];

const StatsSection = () => (
  <section className="py-16 bg-white border-b border-slate-100">
    <div className="container-base px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 rounded-2xl mb-3">
              <stat.icon size={22} className="text-brand-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================================
// SERVICES PREVIEW
// ============================================================

const ServicesPreview = ({ services }) => (
  <section className="section-padding bg-slate-50">
    <div className="container-base">
      <SectionHeader
        label="Layanan Kami"
        title="Apa yang Kami Tawarkan"
        subtitle="Kami menyediakan berbagai layanan digital yang dirancang untuk memenuhi kebutuhan bisnis Anda."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {services.slice(0, 3).map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
      </div>
      {services.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/services" className="btn-secondary">
            Lihat Semua Layanan
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  </section>
);

// ============================================================
// PRODUCTS PREVIEW
// ============================================================
const ProductsPreview = ({ products }) => (
  <section className="section-padding bg-white">
    <div className="container-base">
      <SectionHeader
        label="Produk Unggulan"
        title="Produk Terbaik Kami"
        subtitle="Temukan produk digital berkualitas tinggi yang telah dipercaya oleh ratusan pelanggan."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {products.slice(0, 3).map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
      {products.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/products" className="btn-secondary">
            Lihat Semua Produk
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  </section>
);

// ============================================================
// ABOUT SNIPPET
// ============================================================
const AboutSnippet = () => (
  <section className="section-padding bg-gradient-to-br from-brand-600 to-brand-800 relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: "30px 30px",
      }}
    />
    <div className="container-base relative z-10">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block text-brand-200 font-semibold text-sm uppercase tracking-widest mb-4">
            Tentang Kami
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Kami Berkomitmen untuk Memberikan yang Terbaik
          </h2>
          <p className="text-brand-100 text-lg mt-6 leading-relaxed">
            Dengan pengalaman lebih dari 5 tahun di industri digital, kami telah
            membantu ratusan bisnis bertransformasi dan berkembang. Tim kami
            terdiri dari para profesional berpengalaman yang berdedikasi untuk
            kesuksesan Anda.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl mt-8 hover:bg-brand-50 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
          >
            Pelajari Lebih Lanjut
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </div>
  </section>
);

// ============================================================
// BLOG PREVIEW
// ============================================================
const BlogPreview = ({ blogs }) => (
  <section className="section-padding bg-slate-50">
    <div className="container-base">
      <SectionHeader
        label="Blog & Artikel"
        title="Insight Terbaru"
        subtitle="Temukan artikel dan tips terbaru seputar dunia digital dan teknologi."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {blogs.slice(0, 3).map((blog, i) => (
          <BlogCard key={blog.id} blog={blog} index={i} />
        ))}
      </div>
      {blogs.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/blog" className="btn-secondary">
            Lihat Semua Artikel
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  </section>
);

// ============================================================
// CTA SECTION
// ============================================================
const CTASection = () => (
  <section className="section-padding bg-white">
    <div className="container-base">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-slate-900 to-brand-950 rounded-3xl p-12 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Siap Memulai Perjalanan Digital Anda?
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-xl mx-auto">
            Hubungi kami sekarang dan dapatkan konsultasi gratis untuk kebutuhan
            bisnis Anda.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Link to="/contact" className="btn-primary text-base px-8 py-4">
              Hubungi Kami
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-semibold transition-colors"
            >
              Lihat Produk
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

// ============================================================
// MAIN HOME PAGE
// ============================================================
import usePageCheck from "../../hooks/usePageCheck";

export default function Home() {
  const { pageInfo, siteSettings, isLoading } = usePageCheck("home");

  const { data: productsData } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getProducts(),
  });

  const { data: servicesData } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => getServices(),
  });

  const { data: blogsData } = useQuery({
    queryKey: ["public-blogs"],
    queryFn: () => getBlogs({ status: "published" }),
  });

  const products = productsData?.data?.data || [];
  const services = servicesData?.data?.data || [];
  const blogs = blogsData?.data?.data || [];

  if (isLoading) return <div className="min-h-screen"></div>;

  return (
    <main>
      <HeroSection siteName={siteSettings?.site_name} />
      <StatsSection />
      {services.length > 0 && <ServicesPreview services={services} />}
      {products.length > 0 && <ProductsPreview products={products} />}
      <AboutSnippet />
      {blogs.length > 0 && <BlogPreview blogs={blogs} />}
      <CTASection />
    </main>
  );
}
