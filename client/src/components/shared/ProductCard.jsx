import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, MessageCircle, ImageOff } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";

export default function ProductCard({ product, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="card-base overflow-hidden group"
    >
      {/* Image */}
      <div className="relative h-52 bg-slate-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={32} className="text-slate-300" />
          </div>
        )}
        {product.allow_negotiation && (
          <span className="absolute top-3 right-3 bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
            Negotiable
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-slate-500 text-sm mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
        <p className="text-brand-600 font-bold text-xl mt-3">
          Rp {Number(product.price).toLocaleString("id-ID")}
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200"
          >
            <ShoppingCart size={15} />
            Beli Sekarang
          </Link>
          {product.allow_negotiation && (
            <WhatsAppButton productName={product.name} variant="icon" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
