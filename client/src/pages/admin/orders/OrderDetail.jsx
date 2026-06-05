import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Package,
  Truck,
  Archive,
  Settings,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getOrderById,
  updateOrderStatus,
  updateFulfillment,
  markOrderUnderReview,
} from "../../../api/orders";
import ConfirmModal from "../../../components/ui/ConfirmModal";

// ─── Config ──────────────────────────────────────────────────
const paymentStatusStyles = {
  pending: { class: "bg-yellow-100 text-yellow-700", icon: Clock },
  under_review: { class: "bg-blue-100 text-blue-700", icon: Eye },
  paid: { class: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { class: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: { class: "bg-gray-100 text-gray-500", icon: XCircle },
};

const paymentStatusLabel = {
  pending: "Pending",
  under_review: "Sedang Ditinjau",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const fulfillmentStatusConfig = {
  processing: {
    label: "Diproses",
    icon: Settings,
    color: "text-violet-600",
    bg: "bg-violet-50",
    dot: "bg-violet-400",
  },
  packed: {
    label: "Dikemas",
    icon: Archive,
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  shipped: {
    label: "Dikirim",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  delivered: {
    label: "Sampai",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-400",
  },
  completed: {
    label: "Selesai",
    icon: PartyPopper,
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-400",
  },
};

const historyLabel = {
  processing: "Pesanan Diproses",
  packed: "Pesanan Dikemas",
  shipped: "Pesanan Dikirim",
  delivered: "Pesanan Tiba",
  completed: "Pesanan Selesai",
  type_set: "Tipe Fulfillment Ditetapkan",
};

// ─── Physical flow steps ──────────────────────────────────────
const PHYSICAL_FLOW = ["processing", "packed", "shipped", "delivered"];
const DIGITAL_FLOW = ["processing", "completed"];

function getNextStatus(fulfillmentType, currentStatus) {
  const flow = fulfillmentType === "physical" ? PHYSICAL_FLOW : DIGITAL_FLOW;
  if (!currentStatus) return flow[0];
  const idx = flow.indexOf(currentStatus);
  if (idx === -1 || idx === flow.length - 1) return null;
  return flow[idx + 1];
}

// ─── Sub-components ──────────────────────────────────────────

// Modal: Confirm Paid — tambah catatan manual
function ConfirmPaidModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading,
  isManual,
}) {
  const [note, setNote] = useState("");
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "" : "hidden"}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-900 text-lg mb-1">
          Konfirmasi Pembayaran
        </h3>
        <p className="text-gray-500 text-sm mb-5">
          {isManual
            ? "Tandai order ini sebagai lunas. Isi catatan verifikasi pembayaran manual."
            : "Tandai order ini sebagai lunas secara manual."}
        </p>
        {isManual && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan Verifikasi
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Contoh: Transfer via BCA a.n. John Doe, 28 Jun 2025"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Opsional — sebagai audit trail pembayaran manual.
            </p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
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
                <CheckCircle size={15} /> Konfirmasi Lunas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Shipping info saat update ke shipped
function ShippingModal({ isOpen, onConfirm, onCancel, isLoading }) {
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [noteText, setNoteText] = useState("");

  const handleConfirm = () => {
    if (!courier.trim() || !trackingNumber.trim()) {
      toast.error("Kurir dan nomor resi wajib diisi");
      return;
    }
    onConfirm({ courier, trackingNumber, shippingNote, note: noteText });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? "" : "hidden"}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-900 text-lg mb-1">
          Informasi Pengiriman
        </h3>
        <p className="text-gray-500 text-sm mb-5">
          Isi detail pengiriman untuk pesanan ini.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kurir <span className="text-red-500">*</span>
            </label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih kurir...</option>
              {[
                "JNE",
                "J&T Express",
                "SiCepat",
                "AnterAja",
                "Ninja Express",
                "Pos Indonesia",
                "Tiki",
                "Lion Parcel",
                "Lainnya",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nomor Resi <span className="text-red-500">*</span>
            </label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              placeholder="Contoh: JNE123456789"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan Pengiriman{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              value={shippingNote}
              onChange={(e) => setShippingNote(e.target.value)}
              placeholder="Contoh: Paket dikemas dengan bubble wrap"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catatan History{" "}
              <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Catatan untuk timeline history"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
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
                Menyimpan...
              </>
            ) : (
              <>
                <Truck size={15} /> Simpan & Kirim
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [pendingNextStatus, setPendingNextStatus] = useState(null);
  const [noteModal, setNoteModal] = useState({ open: false, status: null });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getOrderById(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  // ── Mutation: update payment status ─────────────────────────
  const { mutate: changeStatus, isPending: isChangingStatus } = useMutation({
    mutationFn: ({ status, note }) => updateOrderStatus(id, status, note),
    onSuccess: (_, { status }) => {
      invalidate();
      toast.success(
        status === "paid"
          ? "Order dikonfirmasi lunas"
          : status === "cancelled"
            ? "Order dibatalkan"
            : status === "under_review"
              ? "Order ditandai sedang ditinjau"
              : `Status diubah ke ${status}`,
      );
      setConfirmPaidOpen(false);
      setConfirmCancelOpen(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal update status"),
  });

  // ── Mutation: under_review ───────────────────────────────────
  const { mutate: doMarkReview, isPending: isMarkingReview } = useMutation({
    mutationFn: () => markOrderUnderReview(id),
    onSuccess: () => {
      invalidate();
      toast.success("Order ditandai sedang ditinjau");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal update status"),
  });

  // ── Mutation: fulfillment ─────────────────────────────────────
  const { mutate: doFulfillment, isPending: isFulfilling } = useMutation({
    mutationFn: (payload) => updateFulfillment(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Status fulfillment diperbarui");
      setShippingModalOpen(false);
      setPendingNextStatus(null);
      setNoteModal({ open: false, status: null });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal update fulfillment"),
  });

  const order = data?.data?.data;

  // ── Handlers ─────────────────────────────────────────────────
  const handleFulfillmentTypeSelect = (type) => {
    doFulfillment({ fulfillment_type: type });
  };

  const handleNextStatus = (nextStatus) => {
    if (nextStatus === "shipped") {
      setPendingNextStatus(nextStatus);
      setShippingModalOpen(true);
    } else {
      setNoteModal({ open: true, status: nextStatus });
    }
  };

  const handleShippingConfirm = ({
    courier,
    trackingNumber,
    shippingNote,
    note,
  }) => {
    doFulfillment({
      fulfillment_status: "shipped",
      shipping_courier: courier,
      shipping_tracking_number: trackingNumber,
      shipping_note: shippingNote,
      note,
    });
  };

  const handleNoteConfirm = (note) => {
    doFulfillment({ fulfillment_status: noteModal.status, note });
    setNoteModal({ open: false, status: null });
  };

  // ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl h-48 animate-pulse" />
        <div className="bg-white rounded-xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <p className="text-gray-400">Order not found.</p>
      </div>
    );
  }

  const StatusIcon = paymentStatusStyles[order.status]?.icon || Clock;
  const history = order.order_fulfillment_history || [];
  const nextFulfillmentStatus = order.fulfillment_type
    ? getNextStatus(order.fulfillment_type, order.fulfillment_status)
    : null;
  const nextConfig = nextFulfillmentStatus
    ? fulfillmentStatusConfig[nextFulfillmentStatus]
    : null;
  const NextIcon = nextConfig?.icon;
  const isManualOrder = order.payment_method === "manual";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/orders")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Detail</h1>
          <p className="text-sm font-mono text-gray-400 mt-0.5">
            {order.order_number}
          </p>
        </div>
        {isManualOrder && (
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
            Transfer Manual
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <StatusIcon
                  size={20}
                  className={
                    order.status === "paid"
                      ? "text-green-600"
                      : order.status === "pending"
                        ? "text-yellow-600"
                        : order.status === "under_review"
                          ? "text-blue-600"
                          : "text-red-600"
                  }
                />
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusStyles[order.status]?.class}`}
                  >
                    {paymentStatusLabel[order.status] || order.status}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Under review — hanya untuk manual pending */}
                {order.status === "pending" && isManualOrder && (
                  <button
                    onClick={() => doMarkReview()}
                    disabled={isMarkingReview}
                    className="flex items-center gap-1.5 border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Eye size={14} />
                    Tandai Ditinjau
                  </button>
                )}

                {/* Confirm Paid — pending atau under_review */}
                {(order.status === "pending" ||
                  order.status === "under_review") && (
                  <button
                    onClick={() => setConfirmPaidOpen(true)}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} />
                    Konfirmasi Lunas
                  </button>
                )}

                {/* Cancel — pending, under_review, processing */}
                {["pending", "under_review", "processing"].includes(
                  order.status === "paid"
                    ? order.fulfillment_status
                    : order.status,
                ) &&
                  order.status !== "paid" && (
                    <button
                      onClick={() => setConfirmCancelOpen(true)}
                      className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      <XCircle size={14} />
                      Cancel Order
                    </button>
                  )}
              </div>
            </div>

            {/* Manual payment note */}
            {order.manual_payment_note && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-0.5">
                  Catatan Pembayaran Manual
                </p>
                <p className="text-sm text-gray-700">
                  {order.manual_payment_note}
                </p>
              </div>
            )}

            {order.paid_at && (
              <p className="text-xs text-gray-400 mt-3">
                Paid at: {new Date(order.paid_at).toLocaleString("id-ID")}
              </p>
            )}
            {order.midtrans_payment_type && (
              <p className="text-xs text-gray-400 mt-1">
                Payment method: {order.midtrans_payment_type.replace(/_/g, " ")}
              </p>
            )}
          </div>

          {/* ── Fulfillment Section — hanya setelah paid ── */}
          {order.status === "paid" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                Fulfillment
              </h2>

              {/* Step 1: Pilih tipe jika belum dipilih */}
              {!order.fulfillment_type && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">
                    Pilih tipe fulfillment untuk memulai proses pesanan ini:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleFulfillmentTypeSelect("physical")}
                      disabled={isFulfilling}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Truck size={24} className="text-blue-500" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-800">
                          Fisik
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Dikirim via kurir
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFulfillmentTypeSelect("digital")}
                      disabled={isFulfilling}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50 rounded-xl transition-all disabled:opacity-50"
                    >
                      <Package size={24} className="text-violet-500" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-800">
                          Digital / Jasa
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tidak perlu pengiriman
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Status saat ini + tombol next */}
              {order.fulfillment_type && (
                <div className="space-y-4">
                  {/* Status saat ini */}
                  {order.fulfillment_status &&
                    fulfillmentStatusConfig[order.fulfillment_status] &&
                    (() => {
                      const cfg =
                        fulfillmentStatusConfig[order.fulfillment_status];
                      const Icon = cfg.icon;
                      return (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg}`}
                        >
                          <Icon size={18} className={cfg.color} />
                          <div>
                            <p className="text-xs text-gray-400">
                              Status Saat Ini
                            </p>
                            <p className={`text-sm font-semibold ${cfg.color}`}>
                              {cfg.label}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                  {/* Tipe badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Tipe:</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        order.fulfillment_type === "physical"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {order.fulfillment_type === "physical"
                        ? "Fisik"
                        : "Digital / Jasa"}
                    </span>
                  </div>

                  {/* Tombol next status */}
                  {nextFulfillmentStatus && nextConfig && (
                    <button
                      onClick={() => handleNextStatus(nextFulfillmentStatus)}
                      disabled={isFulfilling}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        {NextIcon && <NextIcon size={16} />}
                        <span className="text-sm font-medium">
                          Update ke: {nextConfig.label}
                        </span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  )}

                  {/* Sudah selesai */}
                  {!nextFulfillmentStatus && order.fulfillment_status && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                      <CheckCircle size={16} className="text-green-600" />
                      <p className="text-sm text-green-700 font-medium">
                        Fulfillment selesai
                      </p>
                    </div>
                  )}

                  {/* Shipping info jika shipped/delivered */}
                  {(order.fulfillment_status === "shipped" ||
                    order.fulfillment_status === "delivered") &&
                    order.shipping_courier && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Info Pengiriman
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Kurir</span>
                            <span className="font-medium text-gray-800">
                              {order.shipping_courier}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">No. Resi</span>
                            <span className="font-mono font-bold text-blue-600">
                              {order.shipping_tracking_number}
                            </span>
                          </div>
                          {order.shipping_note && (
                            <div className="pt-1.5 border-t border-blue-100">
                              <p className="text-xs text-gray-400">
                                {order.shipping_note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Rp{" "}
                      {Number(item.price_at_purchase).toLocaleString("id-ID")} ×{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Rp{" "}
                    {(
                      Number(item.price_at_purchase) * item.quantity
                    ).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
              <p className="font-semibold text-gray-700">Total</p>
              <p className="font-bold text-lg text-gray-900">
                Rp {Number(order.total_amount).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Buyer Information
            </h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "Name", value: order.buyer_name },
                { label: "Email", value: order.buyer_email },
                { label: "Phone", value: order.buyer_phone },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  {order.buyer_address}
                </p>
              </div>
            </div>
          </div>

          {/* Order Timeline (payment) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Order Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Order Created</p>
                <p className="text-gray-700 mt-0.5">
                  {new Date(order.created_at).toLocaleString("id-ID")}
                </p>
              </div>
              {order.paid_at && (
                <div>
                  <p className="text-xs text-gray-400">Payment Confirmed</p>
                  <p className="text-gray-700 mt-0.5">
                    {new Date(order.paid_at).toLocaleString("id-ID")}
                  </p>
                </div>
              )}
              {order.midtrans_transaction_id && (
                <div>
                  <p className="text-xs text-gray-400">Transaction ID</p>
                  <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">
                    {order.midtrans_transaction_id}
                  </p>
                </div>
              )}
              {order.payment_method === "manual" &&
                order.manual_payment_note && (
                  <div>
                    <p className="text-xs text-gray-400">Catatan Manual</p>
                    <p className="text-gray-700 mt-0.5 text-xs">
                      {order.manual_payment_note}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Fulfillment History */}
          {history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Fulfillment History
              </h2>
              <div className="space-y-0">
                {history.map((item, i) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          i === history.length - 1
                            ? fulfillmentStatusConfig[item.status]?.dot ||
                              "bg-gray-400"
                            : "bg-gray-300"
                        }`}
                      />
                      {i < history.length - 1 && (
                        <div
                          className="w-0.5 bg-gray-200 flex-1 my-1"
                          style={{ minHeight: "20px" }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className={`text-sm font-medium ${i === history.length - 1 ? "text-gray-900" : "text-gray-500"}`}
                      >
                        {historyLabel[item.status] || item.status}
                      </p>
                      {item.note && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.note}
                        </p>
                      )}
                      {item.admins?.name && (
                        <p className="text-xs text-gray-300 mt-0.5">
                          oleh {item.admins.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {/* Confirm Paid */}
      <ConfirmPaidModal
        isOpen={confirmPaidOpen}
        isLoading={isChangingStatus}
        isManual={isManualOrder}
        onConfirm={(note) => changeStatus({ status: "paid", note })}
        onCancel={() => setConfirmPaidOpen(false)}
      />

      {/* Cancel Order */}
      <ConfirmModal
        isOpen={confirmCancelOpen}
        title="Cancel Order"
        message="Apakah Anda yakin ingin membatalkan order ini? Tindakan ini tidak bisa dibatalkan."
        variant="danger"
        confirmLabel="Cancel Order"
        onConfirm={() => changeStatus({ status: "cancelled" })}
        onCancel={() => setConfirmCancelOpen(false)}
        isLoading={isChangingStatus}
      />

      {/* Shipping Modal */}
      <ShippingModal
        isOpen={shippingModalOpen}
        isLoading={isFulfilling}
        onConfirm={handleShippingConfirm}
        onCancel={() => {
          setShippingModalOpen(false);
          setPendingNextStatus(null);
        }}
      />

      {/* Note Modal — untuk status selain shipped */}
      {noteModal.open && (
        <NoteModal
          status={noteModal.status}
          isLoading={isFulfilling}
          onConfirm={handleNoteConfirm}
          onCancel={() => setNoteModal({ open: false, status: null })}
        />
      )}
    </div>
  );
}

// ── Note Modal — untuk status non-shipped ────────────────────
function NoteModal({ status, onConfirm, onCancel, isLoading }) {
  const [note, setNote] = useState("");
  const cfg = fulfillmentStatusConfig[status] || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-900 text-lg mb-1">
          Update Status: {cfg.label || status}
        </h3>
        <p className="text-gray-500 text-sm mb-5">
          Tambahkan catatan untuk history (opsional).
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Catatan untuk pembeli..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
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
                Menyimpan...
              </>
            ) : (
              "Konfirmasi"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
