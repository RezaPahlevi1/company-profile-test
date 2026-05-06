import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  ImageOff,
  CheckCircle,
  Tag,
  Clock,
} from "lucide-react";
import { getProductById } from "../../api/products";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axiosInstance";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
  });

  const { data: siteSettingsData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/site");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const product = data?.data?.data;
  const siteSettings = siteSettingsData || {};

  if (isLoading) return <Spinner size="lg" className="min-h-screen" />;

  if (!product) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg">Produk tidak ditemukan.</p>
          <Link to="/products" className="btn-primary mt-6 inline-flex">
            Kembali ke Produk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 lg:pt-20">
      <div className="section-padding bg-slate-50 min-h-screen">
        <div className="container-base">
          {/* Back button */}
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
              <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={48} className="text-slate-200" />
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
              {product.allow_negotiation && (
                <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Tag size={12} />
                  Harga Dapat Dinegosiasi
                </span>
              )}

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {product.name}
              </h1>

              <p className="text-3xl font-bold text-brand-600">
                Rp {Number(product.price).toLocaleString("id-ID")}
              </p>

              {product.description && (
                <p className="text-slate-600 text-lg leading-relaxed">
                  {product.description}
                </p>
              )}

              <ul className="space-y-2">
                {[
                  "Produk digital berkualitas tinggi",
                  "Dukungan teknis tersedia",
                  "Garansi kepuasan pelanggan",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-slate-600"
                  >
                    <CheckCircle
                      size={16}
                      className="text-brand-600 shrink-0"
                    />
                    {item}
                  </li>
                ))}
                {siteSettings.delivery_estimation && (
                  <li className="flex items-center gap-3 text-slate-600 mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Clock size={16} className="text-blue-600 shrink-0" />
                    <span className="text-sm font-medium">
                      Estimasi Pengerjaan: {siteSettings.delivery_estimation}
                    </span>
                  </li>
                )}
              </ul>

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
                  state={{ product, quantity }}
                  className="btn-primary flex-1 justify-center text-base py-4"
                >
                  <ShoppingCart size={18} />
                  Beli Sekarang
                </Link>
                {product.allow_negotiation && (
                  <WhatsAppButton
                    productName={product.name}
                    message={`Halo, saya tertarik dengan produk *${product.name}* seharga Rp ${Number(product.price).toLocaleString("id-ID")}. Apakah harga bisa dinegosiasikan?`}
                    className="flex-1 justify-center"
                  />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
