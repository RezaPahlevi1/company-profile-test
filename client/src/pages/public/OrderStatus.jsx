import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  Landmark,
  Eye,
  Truck,
  Settings,
  Archive,
  PartyPopper,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { trackOrder, repayOrder } from "../../api/orders";
import { getSiteSettings } from "../../api/settings";
import { useQuery as useSettingsQuery } from "@tanstack/react-query";

// ─── Payment status config ───────────────────────────────────
const paymentStatusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Menunggu Pembayaran",
    description: "Order Anda sedang menunggu pembayaran.",
  },
  under_review: {
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    label: "Sedang Ditinjau",
    description:
      "Pembayaran Anda sedang ditinjau oleh tim kami. Kami akan segera mengkonfirmasi.",
  },
  paid: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    label: "Pembayaran Berhasil",
    description:
      "Pembayaran Anda telah dikonfirmasi. Terima kasih atas pembelian Anda!",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Pembayaran Gagal",
    description:
      "Pembayaran Anda gagal diproses. Silakan hubungi kami untuk bantuan.",
  },
  cancelled: {
    icon: XCircle,
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-600",
    label: "Order Dibatalkan",
    description: "Order ini telah dibatalkan.",
  },
};

// ─── Fulfillment status config ───────────────────────────────
const fulfillmentConfig = {
  processing: {
    icon: Settings,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dotColor: "bg-violet-500",
    label: "Sedang Diproses",
    description: "Pesanan Anda sedang diproses oleh tim kami.",
  },
  packed: {
    icon: Archive,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dotColor: "bg-amber-500",
    label: "Dikemas",
    description: "Pesanan Anda sedang dikemas dan siap dikirim.",
  },
  shipped: {
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dotColor: "bg-blue-500",
    label: "Dikirim",
    description: "Pesanan Anda sedang dalam perjalanan.",
  },
  delivered: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    dotColor: "bg-green-500",
    label: "Telah Sampai",
    description: "Pesanan Anda telah sampai di tujuan.",
  },
  completed: {
    icon: PartyPopper,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    dotColor: "bg-green-500",
    label: "Selesai",
    description: "Pesanan Anda telah selesai.",
  },
};

// ─── History timeline item label ─────────────────────────────
const historyStatusLabel = {
  processing: "Pesanan Diproses",
  packed: "Pesanan Dikemas",
  shipped: "Pesanan Dikirim",
  delivered: "Pesanan Tiba",
  completed: "Pesanan Selesai",
  type_set: "Tipe Pengiriman Ditetapkan",
};

// ─── Track Form ──────────────────────────────────────────────
const TrackForm = ({ onSearch }) => {
  const [input, setInput] = useState("");
  return (
    <div className="card-base p-8 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Package size={28} className="text-brand-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Lacak Pesanan</h2>
        <p className="text-slate-500 text-sm mt-1">
          Masukkan nomor order Anda untuk melihat status pesanan.
        </p>
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="ORD-20250428-XXXXXX"
          className="input-base flex-1 font-mono"
          onKeyDown={(e) =>
            e.key === "Enter" && input.trim() && onSearch(input.trim())
          }
        />
        <button
          onClick={() => input.trim() && onSearch(input.trim())}
          className="btn-primary px-4"
        >
          <Search size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
export default function OrderStatus() {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();
  const [searchNumber, setSearchNumber] = useState(paramOrderNumber || "");

  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    const snapSrcUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    let script = document.querySelector(`script[src="${snapSrcUrl}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = snapSrcUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // ✅ Ambil site settings untuk info rekening & verifikasi
  const { data: settingsData } = useSettingsQuery({
    queryKey: ["site-settings-public"],
    queryFn: getSiteSettings,
    staleTime: 5 * 60 * 1000,
  });
  const siteSettings = settingsData?.data?.data || {};
  const bankAccountInfo = siteSettings.bank_account_info || "";
  const verificationHours =
    siteSettings.manual_payment_verification_hours || "1x24 jam kerja";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order-track", searchNumber],
    queryFn: () => trackOrder(searchNumber),
    enabled: Boolean(searchNumber),
    retry: false,
  });

  const { mutate: doRepay, isPending: isRepaying } = useMutation({
    mutationFn: () => repayOrder(searchNumber),
    onSuccess: (res) => {
      const { snap_token } = res.data.data;
      window.snap.pay(snap_token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil!");
          refetch();
        },
        onPending: () => {
          toast("Menunggu pembayaran...", { icon: "⏳" });
          refetch();
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          toast("Pembayaran ditutup.", { icon: "⚠️" });
        },
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal memproses pembayaran");
    },
  });

  const handleSearch = (number) => {
    setSearchNumber(number);
    navigate(`/order/${number}`, { replace: true });
  };

  const order = data?.data?.data;
  const paymentConfig = order ? paymentStatusConfig[order.status] : null;
  const PaymentIcon = paymentConfig?.icon;
  const fulfillment = order?.fulfillment_status
    ? fulfillmentConfig[order.fulfillment_status]
    : null;
  const FulfillmentIcon = fulfillment?.icon;
  const history = order?.order_fulfillment_history || [];

  // ✅ Manual payment pending — tampilkan info rekening
  const showManualInfo =
    order?.payment_method === "manual" &&
    (order?.status === "pending" || order?.status === "under_review");

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container-base relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Status Pesanan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg mt-4"
          >
            Pantau status pesanan Anda secara real-time.
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="container-base max-w-2xl">
          <TrackForm onSearch={handleSearch} />

          {/* Loading */}
          {isLoading && searchNumber && (
            <div className="mt-8 text-center">
              <svg
                className="animate-spin h-8 w-8 text-brand-600 mx-auto"
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
              <p className="text-slate-500 mt-3">Mencari pesanan...</p>
            </div>
          )}

          {/* Not found */}
          {!isLoading && searchNumber && !order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 card-base p-8 text-center"
            >
              <Package size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">
                Pesanan tidak ditemukan
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Pastikan nomor order yang Anda masukkan sudah benar.
              </p>
            </motion.div>
          )}

          {/* Order found */}
          {order && paymentConfig && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              {/* ── Payment Status Card ── */}
              <div
                className={`card-base p-6 border ${paymentConfig.border} ${paymentConfig.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${paymentConfig.bg} border ${paymentConfig.border} flex items-center justify-center shrink-0`}
                  >
                    <PaymentIcon size={28} className={paymentConfig.color} />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentConfig.badge}`}
                    >
                      {paymentConfig.label}
                    </span>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                      {paymentConfig.description}
                    </p>
                  </div>
                </div>

                {/* Repay — hanya gateway + pending */}
                {order.status === "pending" &&
                  order.payment_method !== "manual" && (
                    <button
                      onClick={() => doRepay()}
                      disabled={isRepaying}
                      className="btn-primary w-full justify-center mt-4"
                    >
                      {isRepaying ? (
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
                          </svg>{" "}
                          Memproses...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} /> Lanjutkan Pembayaran
                        </>
                      )}
                    </button>
                  )}
              </div>

              {/* ── Manual Payment Info ── */}
              {showManualInfo && bankAccountInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-base p-6 border border-emerald-200 bg-emerald-50"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                      <Landmark size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        Instruksi Transfer
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selesaikan transfer untuk memproses pesanan Anda
                      </p>
                    </div>
                  </div>

                  {/* Info rekening */}
                  <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Rekening Tujuan
                    </p>
                    <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {bankAccountInfo}
                    </pre>
                  </div>

                  {/* Total transfer */}
                  <div className="bg-emerald-100 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-emerald-800">
                        Jumlah Transfer
                      </p>
                      <p className="text-lg font-extrabold text-emerald-700">
                        Rp {Number(order.total_amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      Gunakan <strong>{order.order_number}</strong> sebagai
                      berita acara transfer
                    </p>
                  </div>

                  {/* Langkah */}
                  <div className="space-y-2">
                    {[
                      "Transfer tepat sesuai jumlah di atas",
                      `Cantumkan nomor order sebagai keterangan transfer`,
                      `Pembayaran akan diverifikasi dalam ${verificationHours}`,
                      "Status pesanan diperbarui otomatis setelah konfirmasi",
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-600">{step}</p>
                      </div>
                    ))}
                  </div>

                  {order.status === "under_review" && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                      <Eye
                        size={14}
                        className="text-blue-500 mt-0.5 shrink-0"
                      />
                      <p className="text-xs text-blue-700">
                        Pembayaran Anda sedang dalam proses peninjauan oleh tim
                        kami.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Fulfillment Status ── */}
              {order.status === "paid" && fulfillment && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card-base p-6 border ${fulfillment.border} ${fulfillment.bg}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl ${fulfillment.bg} border ${fulfillment.border} flex items-center justify-center shrink-0`}
                    >
                      <FulfillmentIcon
                        size={28}
                        className={fulfillment.color}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">
                        Status Pengiriman
                      </p>
                      <p
                        className={`font-bold text-base mt-0.5 ${fulfillment.color}`}
                      >
                        {fulfillment.label}
                      </p>
                      <p className="text-slate-600 text-sm mt-0.5">
                        {fulfillment.description}
                      </p>
                    </div>
                  </div>

                  {/* Shipping info — hanya jika shipped/delivered */}
                  {(order.fulfillment_status === "shipped" ||
                    order.fulfillment_status === "delivered") &&
                    order.shipping_courier &&
                    order.shipping_tracking_number && (
                      <div className="bg-white rounded-xl p-4 border border-blue-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                          Informasi Pengiriman
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">
                              Kurir
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              {order.shipping_courier}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">
                              No. Resi
                            </span>
                            <span className="font-mono text-sm font-bold text-blue-600">
                              {order.shipping_tracking_number}
                            </span>
                          </div>
                          {order.shipping_note && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-xs text-slate-400">
                                {order.shipping_note}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </motion.div>
              )}

              {/* ── Fulfillment History Timeline ── */}
              {history.length > 0 && (
                <div className="card-base p-6">
                  <h3 className="font-bold text-slate-900 mb-4">
                    Riwayat Pesanan
                  </h3>
                  <div className="space-y-0">
                    {history.map((item, i) => (
                      <div key={item.id} className="flex gap-4">
                        {/* Dot + line */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                              i === history.length - 1
                                ? fulfillmentConfig[item.status]?.dotColor ||
                                  "bg-slate-400"
                                : "bg-slate-300"
                            }`}
                          />
                          {i < history.length - 1 && (
                            <div
                              className="w-0.5 bg-slate-200 flex-1 my-1"
                              style={{ minHeight: "24px" }}
                            />
                          )}
                        </div>
                        {/* Content */}
                        <div
                          className={`pb-4 ${i === history.length - 1 ? "" : ""}`}
                        >
                          <p
                            className={`text-sm font-semibold ${
                              i === history.length - 1
                                ? "text-slate-900"
                                : "text-slate-500"
                            }`}
                          >
                            {historyStatusLabel[item.status] || item.status}
                          </p>
                          {item.note && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.note}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(item.created_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Order Info ── */}
              <div className="card-base p-6">
                <h3 className="font-bold text-slate-900 mb-4">
                  Detail Pesanan
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Order</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {order.order_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama</span>
                    <span className="font-medium text-slate-900">
                      {order.buyer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-700">{order.buyer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Order</span>
                    <span className="text-slate-700">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar</span>
                    <span className="text-slate-700">
                      {order.payment_method === "manual"
                        ? "Transfer Manual"
                        : order.midtrans_payment_type
                          ? order.midtrans_payment_type.replace(/_/g, " ")
                          : "Via Website"}
                    </span>
                  </div>
                  {order.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dibayar pada</span>
                      <span className="text-slate-700">
                        {new Date(order.paid_at).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Order Items ── */}
              <div className="card-base p-6">
                <h3 className="font-bold text-slate-900 mb-4">Item Pesanan</h3>
                <div className="space-y-3">
                  {order.order_items?.map((item, i) => (
                    <div
                      key={item.product_id || i}
                      className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {item.product_name}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {item.quantity} × Rp{" "}
                          {Number(item.price_at_purchase).toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">
                        Rp{" "}
                        {(
                          item.quantity * Number(item.price_at_purchase)
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-brand-600 text-lg">
                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/products")}
                  className="btn-outline flex-1 justify-center"
                >
                  <ShoppingBag size={16} />
                  Belanja Lagi
                </button>
                <button
                  onClick={() => refetch()}
                  className="btn-outline flex-1 justify-center"
                >
                  <RefreshCw size={16} />
                  Refresh Status
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
}
