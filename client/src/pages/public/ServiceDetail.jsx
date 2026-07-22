import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, ImageOff, CheckCircle } from "lucide-react";
import { getServiceById } from "../../api/services";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import Spinner from "../../components/ui/Spinner";
import usePromoStatus from "../../hooks/usePromoStatus";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(id),
    staleTime: 1000 * 60 * 5,
  });

  const { campaignActive } = usePromoStatus();

  const service = data?.data?.data;
  const canOrder = service?.is_orderable && service?.price != null;

  const promoPrice =
    canOrder &&
    campaignActive &&
    service?.is_promo &&
    service?.discount_percent > 0
      ? service.price - (service.price * service.discount_percent) / 100
      : null;

  if (isLoading) return <Spinner size="lg" className="min-h-screen" />;

  if (!service) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg">Layanan tidak ditemukan.</p>
          <Link to="/services" className="btn-primary mt-6 inline-flex">
            Kembali ke Layanan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 lg:pt-20">
      <div className="section-padding bg-slate-50 min-h-screen">
        <div className="container-base">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={48} className="text-slate-200" />
                  </div>
                )}

                {canOrder &&
                  campaignActive &&
                  service.is_promo &&
                  service.discount_percent > 0 && (
                    <div className="absolute top-0 left-0">
                      <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-br-xl shadow-md">
                        🔥 -{service.discount_percent}%
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {service.name}
              </h1>

              {canOrder && (
                <div>
                  {promoPrice !== null ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl font-bold text-red-600">
                        Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                      </span>
                      <span className="line-through text-slate-400 text-xl">
                        Rp {Number(service.price).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-brand-600">
                      Rp {Number(service.price).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              )}

              {service.description && (
                <p className="text-slate-600 text-lg leading-relaxed">
                  {service.description}
                </p>
              )}

              <ul className="space-y-2">
                {[
                  "Layanan profesional berkualitas tinggi",
                  "Dukungan teknis tersedia",
                  "Garansi kepuasan pelanggan",
                ].map((itemText) => (
                  <li
                    key={itemText}
                    className="flex items-center gap-3 text-slate-600"
                  >
                    <CheckCircle
                      size={16}
                      className="text-brand-600 shrink-0"
                    />
                    {itemText}
                  </li>
                ))}
              </ul>

              {canOrder ? (
                <>
                  {/* Quantity */}
                  <div className="flex items-center gap-4">
                    <span className="text-slate-700 font-medium">Jumlah:</span>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-semibold text-slate-900">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      to="/checkout"
                      state={{ item: service, itemType: "service", quantity }}
                      className="btn-primary flex-1 justify-center text-base py-4"
                    >
                      <ShoppingCart size={18} />
                      Pesan Sekarang
                    </Link>
                    <WhatsAppButton
                      productName={service.name}
                      message={`Halo, saya tertarik dengan layanan *${service.name}*. Boleh saya tahu informasi lebih lanjut?`}
                      className="flex-1 justify-center"
                    />
                  </div>
                </>
              ) : (
                <div className="pt-2">
                  <WhatsAppButton
                    productName={service.name}
                    message={`Halo, saya tertarik dengan layanan ${service.name}. Boleh saya tahu informasi lebih lanjut?`}
                    className="w-full sm:w-auto justify-center"
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
