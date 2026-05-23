import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Tag, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { getProducts } from "../../api/products";
import ProductCard from "../../components/shared/ProductCard";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import usePageCheck from "../../hooks/usePageCheck";
import usePromoStatus from "../../hooks/usePromoStatus";

const formatDateRange = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) return null;
  try {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const sameYear = start.getFullYear() === end.getFullYear();
    const startStr = format(start, sameYear ? "d MMMM" : "d MMMM yyyy", {
      locale: localeId,
    });
    const endStr = format(end, "d MMMM yyyy", { locale: localeId });
    return `${startStr} – ${endStr}`;
  } catch {
    return null;
  }
};

export default function Products() {
  const { pageInfo, isLoading: isPageLoading } = usePageCheck("products");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading: isProductsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getProducts(),
    staleTime: 1000 * 60 * 5,
  });

  const { campaignActive, hasPromo, campaign, promoProducts } =
    usePromoStatus();

  const products = data?.data?.data || [];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all"
        ? true
        : filter === "negotiable"
          ? p.allow_negotiation
          : filter === "fixed"
            ? !p.allow_negotiation
            : true;
    return matchSearch && matchFilter;
  });

  const showPromoBanner =
    campaignActive && hasPromo && promoProducts.length > 0;
  const dateRange = formatDateRange(campaign?.starts_at, campaign?.ends_at);

  if (isPageLoading) return <div className="min-h-screen"></div>;

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-linear-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container-base relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-brand-300 font-semibold text-sm uppercase tracking-widest mb-4"
          >
            {pageInfo?.title || "Produk Kami"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Temukan Produk Terbaik
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mt-4 max-w-xl mx-auto"
          >
            Produk digital berkualitas tinggi untuk kebutuhan bisnis Anda.
          </motion.p>
        </div>
      </section>

      {/* Products */}
      <section className="section-padding bg-slate-50">
        <div className="container-base">
          {/* Banner Kampanye Promo */}
          <AnimatePresence>
            {showPromoBanner && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-red-100"
              >
                {campaign?.banner_url && (
                  <div className="w-full overflow-hidden bg-red-50">
                    <img
                      src={campaign.banner_url}
                      alt={campaign?.title || "Promo Banner"}
                      className="w-full object-cover"
                      style={{
                        maxHeight: "200px",
                        objectFit: "cover",
                        objectPosition: "center",
                      }}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center gap-4">
                  <span className="text-2xl shrink-0">🔥</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-base leading-tight">
                      {campaign?.title || "Promo Spesial!"}
                    </p>
                    {campaign?.description && (
                      <p className="text-red-100 text-sm mt-0.5 line-clamp-1">
                        {campaign.description}
                      </p>
                    )}
                    {/* Range tanggal */}
                    {dateRange && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Calendar size={12} className="text-red-200 shrink-0" />
                        <p className="text-red-100 text-xs font-medium">
                          {dateRange}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Tag size={12} />
                    {promoProducts.length} Produk Promo
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-11"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-base pl-10 pr-10 w-full sm:w-auto appearance-none"
              >
                <option value="all">Semua Produk</option>
                <option value="negotiable">Harga Nego</option>
                <option value="fixed">Harga Tetap</option>
              </select>
            </div>
          </motion.div>

          {isProductsLoading ? (
            <Spinner size="lg" className="py-20" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau filter yang digunakan."
            />
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6">
                Menampilkan {filtered.length} produk
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
