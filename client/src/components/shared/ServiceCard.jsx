import { motion } from "framer-motion";
import { ImageOff, Clock } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";

export default function ServiceCard({ service, index = 0, siteSettings = {} }) {
  // ✅ Guard — jika service undefined/null, tidak crash
  if (!service) return null;

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

        {service.is_promo && (
          <div className="absolute top-0 left-0">
            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-br-xl shadow-md">
              🔥 Sedang Ada Promo!
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg">{service.name}</h3>
        {service.description && (
          <p className="text-slate-500 text-sm mt-2 line-clamp-3">
            {service.description}
          </p>
        )}
        {siteSettings.delivery_estimation && (
          <div className="flex items-center gap-1.5 mt-3 text-blue-600 text-xs font-medium bg-blue-50 w-fit px-2 py-1 rounded">
            <Clock size={12} />
            {siteSettings.delivery_estimation}
          </div>
        )}
        <div className="mt-4">
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
