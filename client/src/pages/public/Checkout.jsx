import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  MapPin,
  ImageOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { createOrder } from "../../api/orders";

const checkoutSchema = z.object({
  buyer_name: z.string().min(1, "Nama wajib diisi"),
  buyer_email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  buyer_phone: z.string().min(8, "Nomor HP tidak valid"),
  buyer_address: z.string().min(10, "Alamat minimal 10 karakter"),
});

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { product, quantity = 1 } = location.state || {};

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(checkoutSchema) });

  const { mutate: submitOrder, isPending } = useMutation({
    mutationFn: createOrder,
    onSuccess: (res) => {
      const { snap_token, order_number } = res.data.data;
      window.snap.pay(snap_token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil!");
          navigate(`/order/${order_number}`);
        },
        onPending: () => {
          toast("Menunggu pembayaran...", { icon: "⏳" });
          navigate(`/order/${order_number}`);
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
          navigate(`/order/${order_number}`);
        },
        onClose: () => {
          toast("Pembayaran dibatalkan. Anda masih bisa melanjutkan nanti.", {
            icon: "⚠️",
          });
          navigate(`/order/${order_number}`);
        },
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal membuat order");
    },
  });

  const onSubmit = (data) => {
    if (!product) {
      toast.error("Produk tidak ditemukan");
      return;
    }

    submitOrder({
      ...data,
      items: [{ product_id: product.id, quantity }],
    });
  };

  if (!product) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">
            Tidak ada produk yang dipilih.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="btn-primary mt-flex inline-flex"
          >
            Lihat Produk
          </button>
        </div>
      </main>
    );
  }

  // ✅ Hitung promo price di checkout
  const promoPrice =
    product.is_promo && product.discount_percent > 0
      ? product.price - (product.price * product.discount_percent) / 100
      : null;

  const effectivePrice = promoPrice ?? Number(product.price);
  const total = Math.round(effectivePrice) * quantity;

  return (
    <main className="pt-16 lg:pt-20">
      <section className="section-padding bg-slate-50 min-h-screen">
        <div className="container-base max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-slate-900 mb-8"
          >
            Checkout
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="card-base p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Informasi Pembeli
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <User size={14} className="inline mr-1.5" />
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("buyer_name")}
                    placeholder="John Doe"
                    className="input-base"
                  />
                  {errors.buyer_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.buyer_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Mail size={14} className="inline mr-1.5" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("buyer_email")}
                    type="email"
                    placeholder="john@example.com"
                    className="input-base"
                  />
                  {errors.buyer_email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.buyer_email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <Phone size={14} className="inline mr-1.5" />
                    Nomor HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("buyer_phone")}
                    placeholder="081234567890"
                    className="input-base"
                  />
                  {errors.buyer_phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.buyer_phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    <MapPin size={14} className="inline mr-1.5" />
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("buyer_address")}
                    rows={3}
                    placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                    className="input-base resize-none"
                  />
                  {errors.buyer_address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.buyer_address.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full justify-center text-base py-4"
                >
                  {isPending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Lanjutkan ke Pembayaran
                    </>
                  )}
                </button>

                <p className="text-xs text-slate-400 text-center">
                  Dengan melanjutkan, Anda setuju dengan syarat dan ketentuan
                  kami. Data Anda aman dan terlindungi.
                </p>
              </form>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="card-base p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Ringkasan Order
                </h2>

                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={20} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* ✅ Tampilan harga di summary */}
                    {promoPrice !== null ? (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-red-600 font-bold">
                          Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                        </span>
                        <span className="line-through text-slate-400 text-sm">
                          Rp {Number(product.price).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ) : (
                      <p className="text-brand-600 font-bold mt-1">
                        Rp {Number(product.price).toLocaleString("id-ID")}
                      </p>
                    )}

                    <p className="text-slate-500 text-sm mt-1">
                      Jumlah: {quantity}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                  {/* ✅ Tampilkan baris diskon jika promo aktif */}
                  {promoPrice !== null && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Diskon ({product.discount_percent}%)</span>
                      <span>
                        -Rp{" "}
                        {Math.round(
                          (product.price - promoPrice) * quantity,
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal ({quantity} item)</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-lg pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span className="text-brand-600">
                      Rp {total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="card-base p-6 bg-brand-50 border-brand-100">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Metode Pembayaran
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Setelah mengisi form, Anda akan diarahkan ke halaman
                  pembayaran Midtrans yang mendukung berbagai metode:
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {[
                    "Transfer Bank / Virtual Account",
                    "QRIS",
                    "Kartu Kredit / Debit",
                    "GoPay, OVO, ShopeePay",
                    "Indomaret / Alfamart",
                  ].map((method) => (
                    <li key={method} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                      {method}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
