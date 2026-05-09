import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, X, ChevronDown } from "lucide-react";
import { getOrders } from "../../../api/orders";
import { useDebounce } from "../../../hooks/useDebounce";

const statusStyles = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusOptions = [
  { label: "Semua", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
];

const LIMIT = 10;

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
    placeholderData: (prev) => prev, // ganti keepPreviousData (deprecated di v5)
  });

  const orders = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilter = (val) => {
    setStatusFilter(val);
    setPage(1);
  };

  const totalPages = pagination?.totalPages ?? 0;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header sticky — sama persis dengan BlogList */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Orders
            </h1>
            {pagination && (
              <p className="text-xs text-gray-400 mt-0.5">
                {pagination.total} total orders
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
              className="appearance-none text-sm border border-gray-200 rounded-lg bg-white pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            {search || statusFilter
              ? "Tidak ada order yang sesuai filter."
              : "Belum ada order masuk."}
          </p>
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
          {/* ✅ Table di desktop */}
          <div
            className={`hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Order Number</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600">
                        {order.order_number}
                      </span>
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
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {order.midtrans_payment_type ? (
                        order.midtrans_payment_type.replace(/_/g, " ")
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors"
                        title="View Detail"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Card list di mobile */}
          <div
            className={`lg:hidden space-y-2 transition-opacity duration-200 ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3"
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: order number + status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-gray-500">
                      {order.order_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Row 2: nama + email */}
                  <p className="font-medium text-gray-900 text-sm mt-1 line-clamp-1">
                    {order.buyer_name}
                  </p>
                  <p className="text-[11px] text-gray-400 line-clamp-1">
                    {order.buyer_email}
                  </p>

                  {/* Row 3: total + tanggal */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">
                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Row 4: payment method */}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {order.midtrans_payment_type
                      ? order.midtrans_payment_type.replace(/_/g, " ")
                      : "—"}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors border border-gray-100 shrink-0"
                  title="View Detail"
                >
                  <Eye size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination — sama persis dengan BlogList */}
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
