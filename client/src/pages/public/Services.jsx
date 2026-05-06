import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getServices } from "../../api/services";
import ServiceCard from "../../components/shared/ServiceCard";
import SectionHeader from "../../components/ui/SectionHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import usePageCheck from "../../hooks/usePageCheck";

export default function Services() {
  const {
    pageInfo,
    siteSettings,
    isLoading: isPageLoading,
  } = usePageCheck("services");
  const [search, setSearch] = useState("");

  const { data, isLoading: isServicesLoading } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => getServices(),
  });

  const services = data?.data?.data || [];

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()),
  );

  if (isPageLoading) return <div className="min-h-screen"></div>;

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
            {pageInfo?.title || "Layanan Kami"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Apa yang Bisa Kami Lakukan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mt-4 max-w-xl mx-auto"
          >
            Layanan profesional yang dirancang untuk memenuhi kebutuhan unik
            bisnis Anda.
          </motion.p>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding bg-slate-50">
        <div className="container-base">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mb-10"
          >
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-11"
              />
            </div>
          </motion.div>

          {isServicesLoading ? (
            <Spinner size="lg" className="py-20" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Layanan tidak ditemukan"
              description="Coba ubah kata kunci pencarian."
            />
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-6">
                Menampilkan {filtered.length} layanan
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((service, i) => (
                  <ServiceCard key={service.id} service={service} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-white">
        <div className="container-base">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl font-bold text-slate-900">
              Tidak Menemukan yang Anda Cari?
            </h2>
            <p className="text-slate-600 text-lg mt-4 max-w-xl mx-auto">
              Hubungi kami langsung dan diskusikan kebutuhan spesifik bisnis
              Anda. Kami siap memberikan solusi yang tepat.
            </p>
            <div className="mt-8">
              <WhatsAppButton
                message="Halo, saya ingin berdiskusi tentang kebutuhan layanan untuk bisnis saya."
                className="inline-flex"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
