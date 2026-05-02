import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { getProducts } from "../../api/products";
import ProductCard from "../../components/shared/ProductCard";
import SectionHeader from "../../components/ui/SectionHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";

export default function Products() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => getProducts(),
  });

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

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
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
            Produk Kami
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

          {isLoading ? (
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
