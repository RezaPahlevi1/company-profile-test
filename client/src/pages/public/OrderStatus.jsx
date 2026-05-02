import { useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import { trackOrder, repayOrder } from "../../api/orders";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Menunggu Pembayaran",
    description:
      "Order Anda sedang menunggu pembayaran. Selesaikan pembayaran untuk melanjutkan.",
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

export default function OrderStatus() {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState(paramOrderNumber || "");
  const [searchNumber, setSearchNumber] = useState(paramOrderNumber || "");

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
    setOrderNumber(number);
    setSearchNumber(number);
    navigate(`/order/${number}`, { replace: true });
  };

  const order = data?.data?.data;
  const config = order ? statusConfig[order.status] : null;
  const StatusIcon = config?.icon;

  return (
    <main className="pt-16 lg:pt-20">
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

          {order && config && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              {/* Status Card */}
              <div
                className={`card-base p-6 border ${config.border} ${config.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl ${config.bg} border ${config.border} flex items-center justify-center`}
                  >
                    <StatusIcon size={28} className={config.color} />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}
                    >
                      {config.label}
                    </span>
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                      {config.description}
                    </p>
                  </div>
                </div>

                {/* Repay button — hanya untuk pending */}
                {order.status === "pending" && (
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
                        </svg>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Lanjutkan Pembayaran
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Order Info */}
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
                  {order.midtrans_payment_type && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Metode Bayar</span>
                      <span className="text-slate-700">
                        {order.midtrans_payment_type.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}
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

              {/* Items */}
              <div className="card-base p-6">
                <h3 className="font-bold text-slate-900 mb-4">Item Pesanan</h3>
                <div className="space-y-3">
                  {order.order_items?.map((item, i) => (
                    <div
                      key={i}
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

              {/* Actions */}
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
