import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { getOrderById, updateOrderStatus } from "../../../api/orders";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const statusStyles = {
  pending: { class: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { class: "bg-green-100 text-green-700", icon: CheckCircle },
  failed: { class: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: { class: "bg-gray-100 text-gray-500", icon: XCircle },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    title: "",
    message: "",
    variant: "danger",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getOrderById(id),
  });

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: ({ status }) => updateOrderStatus(id, status),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Order marked as ${status}`);
      setConfirmModal({ ...confirmModal, isOpen: false });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update status");
    },
  });

  const handleConfirmPaid = () => {
    setConfirmModal({
      isOpen: true,
      action: "paid",
      title: "Confirm Payment",
      message:
        "Mark this order as paid? This action confirms manual payment verification.",
      variant: "primary",
    });
  };

  const handleConfirmCancel = () => {
    setConfirmModal({
      isOpen: true,
      action: "cancelled",
      title: "Cancel Order",
      message:
        "Are you sure you want to cancel this order? This action cannot be undone.",
      variant: "danger",
    });
  };

  const order = data?.data?.data;

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

  const StatusIcon = statusStyles[order.status]?.icon || Clock;

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusIcon
                  size={20}
                  className={
                    order.status === "paid"
                      ? "text-green-600"
                      : order.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }
                />
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[order.status]?.class}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Action buttons — only show for pending */}
              {order.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmPaid}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} />
                    Confirm Paid
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <XCircle size={14} />
                    Cancel Order
                  </button>
                </div>
              )}
            </div>

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

        {/* Right — Buyer Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Buyer Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {order.buyer_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-gray-700 mt-0.5">{order.buyer_email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-gray-700 mt-0.5">{order.buyer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-gray-700 mt-0.5 leading-relaxed">
                  {order.buyer_address}
                </p>
              </div>
            </div>
          </div>

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
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={
          confirmModal.action === "paid" ? "Confirm Paid" : "Cancel Order"
        }
        onConfirm={() => changeStatus({ status: confirmModal.action })}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        isLoading={isPending}
      />
    </div>
  );
}
