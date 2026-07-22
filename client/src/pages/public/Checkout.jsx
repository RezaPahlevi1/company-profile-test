import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  MapPin,
  ImageOff,
  CreditCard,
  Landmark,
  ChevronRight,
  Info,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { createOrder } from "../../api/orders";
import { getSiteSettings } from "../../api/settings";
import usePromoStatus from "../../hooks/usePromoStatus";
import useSnapScript from "../../hooks/useSnapScript";

const checkoutSchema = z.object({
  buyer_name: z.string().min(1, "Nama wajib diisi"),
  buyer_email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  buyer_phone: z.string().min(8, "Nomor HP tidak valid"),
  buyer_address: z.string().min(10, "Alamat minimal 10 karakter"),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui syarat dan ketentuan",
  }),
});

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Generalisasi: terima bentuk baru { item, itemType } (service)
  // ATAU bentuk lama { product, quantity } (product, dari ProductDetail.jsx — tidak diubah)
  const state = location.state || {};
  const itemType = state.itemType || "product";
  const item = state.item || state.product;
  const quantity = state.quantity || 1;

  const { campaignActive } = usePromoStatus();

  useSnapScript();

  const [paymentMethod, setPaymentMethod] = useState("gateway");

  const { data: settingsData } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: getSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
  const siteSettings = settingsData?.data?.data || {};
  const bankAccountInfo = siteSettings.bank_account_info || "";
  const manualPaymentAvailable = bankAccountInfo.trim().length > 0;
  const gatewayAvailable = siteSettings.gateway_payment_enabled !== "false";
  const noPaymentAvailable = !gatewayAvailable && !manualPaymentAvailable;
  const verificationHours =
    siteSettings.manual_payment_verification_hours || "1x24 jam kerja";

  const [prevAvailability, setPrevAvailability] = useState({
    gatewayAvailable,
    manualPaymentAvailable,
  });

  if (
    prevAvailability.gatewayAvailable !== gatewayAvailable ||
    prevAvailability.manualPaymentAvailable !== manualPaymentAvailable
  ) {
    setPrevAvailability({ gatewayAvailable, manualPaymentAvailable });

    if (
      !manualPaymentAvailable &&
      paymentMethod === "manual" &&
      gatewayAvailable
    ) {
      setPaymentMethod("gateway");
    } else if (
      !gatewayAvailable &&
      paymentMethod === "gateway" &&
      manualPaymentAvailable
    ) {
      setPaymentMethod("manual");
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { terms_accepted: false },
  });

  const { mutate: submitOrder, isPending } = useMutation({
    mutationFn: createOrder,
    onSuccess: (res) => {
      const {
        order_number,
        payment_method: method,
        snap_token,
      } = res.data.data;

      if (method === "manual" || !snap_token) {
        toast.success(
          "Order berhasil dibuat! Silakan transfer sesuai instruksi.",
        );
        navigate(`/order/${order_number}`);
        return;
      }

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
    if (!item) {
      toast.error(
        itemType === "service"
          ? "Layanan tidak ditemukan"
          : "Produk tidak ditemukan",
      );
      return;
    }
    // eslint-disable-next-line no-unused-vars
    const { terms_accepted, ...orderData } = data;
    submitOrder({
      ...orderData,
      items:
        itemType === "service"
          ? [{ item_type: "service", service_id: item.id, quantity }]
          : [{ item_type: "product", product_id: item.id, quantity }],
      payment_method: paymentMethod,
    });
  };

  if (!item) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">
            Tidak ada {itemType === "service" ? "layanan" : "produk"} yang
            dipilih.
          </p>
          <button
            onClick={() =>
              navigate(itemType === "service" ? "/services" : "/products")
            }
            className="btn-primary mt-4 inline-flex"
          >
            {itemType === "service" ? "Lihat Layanan" : "Lihat Produk"}
          </button>
        </div>
      </main>
    );
  }

  if (noPaymentAvailable) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Info size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">
            Pembayaran sedang tidak tersedia saat ini.
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Silakan hubungi kami langsung untuk melanjutkan pemesanan.
          </p>
          {siteSettings.whatsapp_number && (
            <a
              href={`https://wa.me/${siteSettings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              Hubungi via WhatsApp
            </a>
          )}
        </div>
      </main>
    );
  }

  const promoPrice =
    campaignActive && item.is_promo && item.discount_percent > 0
      ? item.price - (item.price * item.discount_percent) / 100
      : null;

  const effectivePrice = promoPrice ?? Number(item.price);
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
            {/* ── Form ── */}
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

                {/* ── Pilihan Metode Pembayaran ── */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {gatewayAvailable && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("gateway")}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "gateway"
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            paymentMethod === "gateway"
                              ? "bg-brand-100"
                              : "bg-slate-100"
                          }`}
                        >
                          <CreditCard
                            size={18}
                            className={
                              paymentMethod === "gateway"
                                ? "text-brand-600"
                                : "text-slate-400"
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold ${paymentMethod === "gateway" ? "text-brand-700" : "text-slate-700"}`}
                          >
                            Bayar via Website
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Transfer bank, QRIS, e-wallet
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            paymentMethod === "gateway"
                              ? "border-brand-500"
                              : "border-slate-300"
                          }`}
                        >
                          {paymentMethod === "gateway" && (
                            <div className="w-2 h-2 rounded-full bg-brand-500" />
                          )}
                        </div>
                      </button>
                    )}

                    {manualPaymentAvailable && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("manual")}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          paymentMethod === "manual"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            paymentMethod === "manual"
                              ? "bg-emerald-100"
                              : "bg-slate-100"
                          }`}
                        >
                          <Landmark
                            size={18}
                            className={
                              paymentMethod === "manual"
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold ${paymentMethod === "manual" ? "text-emerald-700" : "text-slate-700"}`}
                          >
                            Transfer Manual
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Transfer bank langsung, konfirmasi oleh admin
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            paymentMethod === "manual"
                              ? "border-emerald-500"
                              : "border-slate-300"
                          }`}
                        >
                          {paymentMethod === "manual" && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {paymentMethod === "manual" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                          <div className="flex items-start gap-2">
                            <Info
                              size={14}
                              className="text-emerald-600 mt-0.5 shrink-0"
                            />
                            <p className="text-xs text-emerald-700">
                              Setelah order dibuat, Anda akan mendapat informasi
                              rekening tujuan transfer. Pembayaran akan
                              diverifikasi dalam{" "}
                              <strong>{verificationHours}</strong>.
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-emerald-100">
                            <p className="text-xs font-semibold text-slate-600 mb-1.5">
                              Rekening Tujuan:
                            </p>
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                              {bankAccountInfo}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    {siteSettings.terms_highlight ||
                      "Pemesanan hanya kami layani untuk wilayah Pulau Batam."}
                  </p>
                </div>

                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("terms_accepted")}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 shrink-0"
                    />
                    <span className="text-sm text-slate-600">
                      Saya sudah membaca dan setuju dengan{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 font-medium hover:underline"
                      >
                        Syarat dan Ketentuan
                      </Link>{" "}
                      kami.
                    </span>
                  </label>
                  {errors.terms_accepted && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.terms_accepted.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className={`w-full justify-center text-base py-4 flex items-center gap-2 font-semibold rounded-xl transition-all ${
                    paymentMethod === "manual"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-400"
                      : "btn-primary disabled:opacity-60"
                  }`}
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
                  ) : paymentMethod === "manual" ? (
                    <>
                      <Landmark size={18} />
                      Buat Order & Lihat Info Transfer
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Lanjutkan ke Pembayaran
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* ── Order Summary ── */}
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
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
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
                      {item.name}
                    </h3>
                    {promoPrice !== null ? (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-red-600 font-bold">
                          Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                        </span>
                        <span className="line-through text-slate-400 text-sm">
                          Rp {Number(item.price).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ) : (
                      <p className="text-brand-600 font-bold mt-1">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </p>
                    )}
                    <p className="text-slate-500 text-sm mt-1">
                      Jumlah: {quantity}
                    </p>
                    {item.delivery_estimation && (
                      <div className="flex items-center gap-1.5 mt-2 text-blue-600 text-xs font-medium bg-blue-50 w-fit px-2 py-1 rounded">
                        <Clock size={12} />
                        Estimasi: {item.delivery_estimation}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                  {promoPrice !== null && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Diskon ({item.discount_percent}%)</span>
                      <span>
                        -Rp{" "}
                        {Math.round(
                          (item.price - promoPrice) * quantity,
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{`Subtotal (${quantity} item)`}</span>
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

              <AnimatePresence mode="wait">
                {paymentMethod === "gateway" ? (
                  <motion.div
                    key="gateway-info"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card-base p-6 bg-brand-50 border-brand-100"
                  >
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CreditCard size={16} className="text-brand-500" />
                      Metode yang Didukung
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-600">
                      {[
                        "Transfer Bank / Virtual Account",
                        "QRIS",
                        "GoPay, OVO, ShopeePay",
                        "Indomaret / Alfamart",
                      ].map((method) => (
                        <li key={method} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-400 rounded-full shrink-0" />
                          {method}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual-info"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="card-base p-6 bg-emerald-50 border-emerald-100"
                  >
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Landmark size={16} className="text-emerald-600" />
                      Alur Transfer Manual
                    </h3>
                    <ol className="space-y-2 text-sm text-slate-600 list-none">
                      {[
                        "Klik tombol buat order di bawah",
                        "Transfer ke rekening yang tertera",
                        `Admin verifikasi dalam ${verificationHours}`,
                        "Status order diperbarui otomatis",
                      ].map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
