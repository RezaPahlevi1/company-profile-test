import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";

export default function ServiceCard({ service, index = 0 }) {
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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={32} className="text-slate-300" />
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
