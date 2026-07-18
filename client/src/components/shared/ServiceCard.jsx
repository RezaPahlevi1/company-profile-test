import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ImageOff, Clock, ShoppingCart } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import usePromoStatus from "../../hooks/usePromoStatus";

export default function ServiceCard({ service, index = 0 }) {
  const { campaignActive } = usePromoStatus();

  if (!service) return null;

  const showPromoBadge = campaignActive && service.is_promo;
  const canOrder = service.is_orderable && service.price != null;

  const promoPrice =
    canOrder &&
    campaignActive &&
    service.is_promo &&
    service.discount_percent > 0
      ? service.price - (service.price * service.discount_percent) / 100
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="card-base overflow-hidden group"
    >
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            width={600}
            height={192}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={32} className="text-slate-300" />
          </div>
        )}

        {/* Badge promo — hanya tampil jika kampanye aktif */}
        {showPromoBadge && (
          <div className="absolute top-0 left-0">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-br-xl shadow-md">
              🔥 Sedang Ada Promo!
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg">{service.name}</h3>

        {/* Harga — hanya tampil jika bisa dipesan online */}
        {canOrder && (
          <div className="mt-1.5">
            {promoPrice !== null ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-red-600 font-bold">
                  Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                </span>
                <span className="line-through text-slate-400 text-sm">
                  Rp {Number(service.price).toLocaleString("id-ID")}
                </span>
              </div>
            ) : (
              <span className="text-brand-600 font-bold">
                Rp {Number(service.price).toLocaleString("id-ID")}
              </span>
            )}
          </div>
        )}

        {service.description && (
          <p className="text-slate-500 text-sm mt-2 line-clamp-3">
            {service.description}
          </p>
        )}
        {service.delivery_estimation && (
          <div className="flex items-center gap-1.5 mt-3 text-blue-600 text-xs font-medium bg-blue-50 w-fit px-2 py-1 rounded">
            <Clock size={12} />
            {service.delivery_estimation}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {/* Tombol Pesan — hanya jika is_orderable && ada harga */}
          {canOrder && (
            <Link
              to="/checkout"
              state={{ item: service, itemType: "service" }}
              className="btn-primary w-full justify-center"
            >
              <ShoppingCart size={16} />
              Pesan Sekarang
            </Link>
          )}

          {/* WA tetap ada sebagai fallback/kontak, tidak pernah dihilangkan */}
          <WhatsAppButton
            productName={service.name}
            message={`Halo, saya tertarik dengan layanan ${service.name}. Boleh saya tahu informasi lebih lanjut?`}
            className="w-full justify-center"
          />
        </div>
      </div>
    </motion.div>
  );
}
