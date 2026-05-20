import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Tag } from "lucide-react";
import { getServices } from "../../api/services";
import { getSiteSettings } from "../../api/settings";
import ServiceCard from "../../components/shared/ServiceCard";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import usePageCheck from "../../hooks/usePageCheck";
import usePromoStatus from "../../hooks/usePromoStatus";

export default function Services() {
  const { pageInfo, isLoading: isPageLoading } = usePageCheck("services");
  const [search, setSearch] = useState("");

  const { data, isLoading: isServicesLoading } = useQuery({
    queryKey: ["public-services"],
    queryFn: () => getServices(),
  });

  // Fix bug: siteSettings tidak di-fetch dan tidak di-pass ke ServiceCard
  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const { campaignActive, hasPromo, campaign, promoServices } =
    usePromoStatus();

  const services = data?.data?.data || [];
  const siteSettings = siteData?.data?.data || {};

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()),
  );

  // Banner promo hanya tampil jika kampanye aktif dan ada service promo
  const showPromoBanner =
    campaignActive && hasPromo && promoServices.length > 0;

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
          {/* Banner Kampanye Promo — Opsi A: di atas search bar */}
          <AnimatePresence>
            {showPromoBanner && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-orange-100"
              >
                {/* Gambar banner jika ada */}
                {campaign?.banner_url && (
                  <div className="w-full overflow-hidden bg-orange-50">
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

                {/* Info teks kampanye */}
                <div className="bg-linear-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center gap-4">
                  <span className="text-2xl shrink-0">🔥</span>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base leading-tight">
                      {campaign?.title || "Promo Spesial!"}
                    </p>
                    {campaign?.description && (
                      <p className="text-orange-100 text-sm mt-0.5 line-clamp-1">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <Tag size={12} />
                    {promoServices.length} Layanan Promo
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <ServiceCard
                    key={service.id}
                    service={service}
                    index={i}
                    siteSettings={siteSettings}
                  />
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
            className="bg-linear-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-12 text-center"
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
