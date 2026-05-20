import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, MessageCircle, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import usePromoStatus from "../../hooks/usePromoStatus";

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasPromo, campaignActive, campaign, promoProducts, promoServices } =
    usePromoStatus();

  useEffect(() => {
    if (!hasPromo || !campaignActive) return;

    // Hanya tampil sekali per session
    const shown = sessionStorage.getItem("promo_popup_shown");
    if (shown) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("promo_popup_shown", "true");
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasPromo, campaignActive]);

  const handleClose = () => setIsOpen(false);

  if (!hasPromo || !campaignActive) return null;

  const waNumber = import.meta.env.VITE_WA_NUMBER || "628123456789";

  // Judul yang ditampilkan di header — dari kampanye jika ada, fallback ke default
  const headerTitle = campaign?.title || "Promo Spesial!";
  const headerDesc =
    campaign?.description || "Jangan lewatkan penawaran terbatas ini";
  const hasBanner = campaign?.banner_url && campaign.banner_url !== "";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden pointer-events-auto">
              {/* Header gradient — selalu ada */}
              <div className="relative bg-linear-to-r from-red-500 to-orange-500 p-6 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div className="min-w-0 pr-8">
                    <h2 className="text-xl font-bold leading-tight">
                      {headerTitle}
                    </h2>
                    {headerDesc && (
                      <p className="text-red-100 text-sm mt-0.5 line-clamp-2">
                        {headerDesc}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner gambar — Opsi A: full width di bawah header */}
              {hasBanner && (
                <div className="w-full overflow-hidden">
                  <img
                    src={campaign.banner_url}
                    alt={headerTitle}
                    className="w-full object-cover"
                    style={{
                      // Landscape default ~150px, auto-adjust jika portrait
                      maxHeight: "180px",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                    loading="lazy"
                  />
                </div>
              )}

              {/* Content — list produk dan service */}
              <div className="overflow-y-auto max-h-[50vh] p-5 space-y-4">
                {/* Promo Products */}
                {promoProducts.length > 0 && (
                  <div>
                    {promoProducts.length > 0 && promoServices.length > 0 && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Produk Promo
                      </p>
                    )}
                    <div className="space-y-3">
                      {promoProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl"
                        >
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-14 h-14 object-cover rounded-lg shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-red-100 rounded-lg shrink-0 flex items-center justify-center">
                              <Tag size={18} className="text-red-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-red-600 font-bold text-sm">
                                Rp{" "}
                                {Number(product.promo_price).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                              <span className="line-through text-gray-400 text-xs">
                                Rp{" "}
                                {Number(product.price).toLocaleString("id-ID")}
                              </span>
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                -{product.discount_percent}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Promo Services */}
                {promoServices.length > 0 && (
                  <div>
                    {promoProducts.length > 0 && promoServices.length > 0 && (
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Layanan Promo
                      </p>
                    )}
                    <div className="space-y-3">
                      {promoServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl"
                        >
                          {service.image_url ? (
                            <img
                              src={service.image_url}
                              alt={service.name}
                              className="w-14 h-14 object-cover rounded-lg shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-orange-100 rounded-lg shrink-0 flex items-center justify-center">
                              <Tag size={18} className="text-orange-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm line-clamp-1">
                              {service.name}
                            </p>
                            <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full mt-1 font-semibold">
                              🔥 Sedang Promo
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="p-5 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  {promoProducts.length > 0 && (
                    <Link
                      to="/products"
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      <ShoppingCart size={15} />
                      Lihat Produk
                    </Link>
                  )}
                  {promoServices.length > 0 && (
                    <a
                      href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                        "Halo, saya tertarik dengan layanan promo yang tersedia!",
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      <MessageCircle size={15} />
                      Tanya via WA
                    </a>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full text-gray-400 hover:text-gray-600 text-xs py-1.5 transition-colors"
                >
                  Tutup, lihat nanti
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
