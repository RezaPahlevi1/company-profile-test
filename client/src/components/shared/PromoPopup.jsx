import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, MessageCircle, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

const getActivePromos = () => axiosInstance.get("/promos");

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["active-promos"],
    queryFn: getActivePromos,
    staleTime: 1000 * 60 * 5,
  });

  const promos = data?.data?.data;
  const hasPromo = promos?.hasPromo;

  useEffect(() => {
    if (!hasPromo) return;

    // Cek sessionStorage — hanya tampil sekali per session
    const shown = sessionStorage.getItem("promo_popup_shown");
    if (shown) return;

    // Delay sedikit agar halaman load dulu
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem("promo_popup_shown", "true");
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasPromo]);

  const handleClose = () => setIsOpen(false);

  if (!hasPromo) return null;

  const promoProducts = promos?.products || [];
  const promoServices = promos?.services || [];
  const waNumber = import.meta.env.VITE_WA_NUMBER || "628123456789";

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
              {/* Header */}
              <div className="relative bg-linear-to-r from-red-500 to-orange-500 p-6 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔥</span>
                  <div>
                    <h2 className="text-xl font-bold">Promo Spesial!</h2>
                    <p className="text-red-100 text-sm mt-0.5">
                      Jangan lewatkan penawaran terbatas ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
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
                      {promoProducts.map((product) => {
                        const promoPrice = Math.round(
                          product.price -
                            (product.price * product.discount_percent) / 100,
                        );
                        return (
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
                                  Rp {promoPrice.toLocaleString("id-ID")}
                                </span>
                                <span className="line-through text-gray-400 text-xs">
                                  Rp{" "}
                                  {Number(product.price).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                  -{product.discount_percent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                      href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo, saya tertarik dengan layanan promo yang tersedia!")}`}
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
