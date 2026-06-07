import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, X, ChevronDown, AlertCircle } from "lucide-react";
import { getOrders } from "../../../api/orders";
import { useDebounce } from "../../../hooks/useDebounce";

// ─── Payment status styles ────────────────────────────────────
const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700",
  under_review: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusLabels = {
  pending: "Pending",
  under_review: "Ditinjau",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusOptions = [
  { label: "Semua", value: "" },
  { label: "Perlu Tindakan", value: "needs_action" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

// ✅ Fix #11 — satu konstanta saja, hapus duplikat LIMIT yang tidak terpakai
const LIMIT = 10;

// ─── Helper: tentukan action badge untuk satu order ──────────
function getActionBadge(order) {
  if (
    order.payment_method === "manual" &&
    (order.status === "pending" || order.status === "under_review")
  ) {
    return {
      dot: "bg-yellow-400",
      label:
        order.status === "under_review"
          ? "Sedang Ditinjau"
          : "Verifikasi Transfer",
      labelClass: "bg-yellow-100 text-yellow-700",
    };
  }

  if (order.status === "paid" && !order.fulfillment_type) {
    return {
      dot: "bg-blue-400",
      label: "Tentukan Tipe",
      labelClass: "bg-blue-100 text-blue-700",
    };
  }

  if (
    order.status === "paid" &&
    order.fulfillment_type === "physical" &&
    order.fulfillment_status !== "delivered"
  ) {
    return {
      dot: "bg-orange-400",
      label: "Update Status",
      labelClass: "bg-orange-100 text-orange-700",
    };
  }

  if (
    order.status === "paid" &&
    order.fulfillment_type === "digital" &&
    order.fulfillment_status !== "completed"
  ) {
    return {
      dot: "bg-orange-400",
      label: "Update Status",
      labelClass: "bg-orange-100 text-orange-700",
    };
  }

  return null;
}

// ─── Main Component ──────────────────────────────────────────
export default function OrderList() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-orders", statusFilter, debouncedSearch, page],
    queryFn: () =>
      getOrders({
        ...(statusFilter && { status: statusFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        page,
        limit: LIMIT,
      }),
    retry: false,
    placeholderData: (prev) => prev,
  });

  const orders = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const isNeedsAction = statusFilter === "needs_action";

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Orders
            </h1>
            {pagination && (
              <p className="text-xs text-gray-400 mt-0.5">
                {pagination.total} total order
              </p>
            )}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari nama, email, atau nomor order..."
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleFilter(e.target.value)}
              className={`appearance-none text-sm border rounded-lg bg-white pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isNeedsAction
                  ? "border-orange-300 text-orange-600 bg-orange-50"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Banner info needs_action */}
        {isNeedsAction && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle size={13} className="text-orange-500 shrink-0" />
            <p className="text-xs text-orange-600">
              Menampilkan order yang membutuhkan tindakan admin.
            </p>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center">
          {isNeedsAction ? (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={20} className="text-green-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">
                Semua order sudah ditangani
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Tidak ada order yang membutuhkan tindakan saat ini.
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              {search || statusFilter
                ? "Tidak ada order yang sesuai filter."
                : "Belum ada order masuk."}
            </p>
          )}
          {(search || statusFilter) && (
            <button
              onClick={() => {
                handleSearch("");
                handleFilter("");
              }}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div
            className={`hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Order Number</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Metode</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Tindakan</th>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const badge = getActionBadge(order);
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 transition-colors ${badge ? "bg-orange-50/30" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {badge ? (
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`}
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full shrink-0 bg-gray-200" />
                          )}
                          <span className="font-mono text-xs text-gray-600">
                            {order.order_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {order.buyer_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.buyer_email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        Rp {Number(order.total_amount).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        {order.payment_method === "manual" ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Transfer Manual
                          </span>
                        ) : order.midtrans_payment_type ? (
                          <span className="text-xs text-gray-500">
                            {order.midtrans_payment_type.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[order.status] || "bg-gray-100 text-gray-500"}`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {badge ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${badge.labelClass}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Card List ── */}
          <div
            className={`lg:hidden space-y-2 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            {orders.map((order) => {
              const badge = getActionBadge(order);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 ${
                    badge
                      ? "border-l-4 " +
                        (badge.dot === "bg-yellow-400"
                          ? "border-yellow-400"
                          : badge.dot === "bg-blue-400"
                            ? "border-blue-400"
                            : "border-orange-400")
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {badge && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${badge.dot}`}
                        />
                      )}
                      <span className="font-mono text-[11px] text-gray-500">
                        {order.order_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[order.status] || "bg-gray-100 text-gray-500"}`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                      {badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badge.labelClass}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm mt-1 line-clamp-1">
                      {order.buyer_name}
                    </p>
                    <p className="text-[11px] text-gray-400 line-clamp-1">
                      {order.buyer_email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">
                        Rp {Number(order.total_amount).toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      {order.payment_method === "manual" ? (
                        <span className="text-[10px] font-medium text-emerald-600">
                          Transfer Manual
                        </span>
                      ) : order.midtrans_payment_type ? (
                        <span className="text-[10px] text-gray-400">
                          {order.midtrans_payment_type.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors border border-gray-100 shrink-0"
                    title="Lihat Detail"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {pagination.total} order · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`e-${idx}`}
                        className="px-2 py-1.5 text-xs text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                          page === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
