import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Package,
  Briefcase,
  FileText,
  ShoppingCart,
  Users,
  TrendingUp,
  Globe,
  DollarSign,
  BarChart2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axiosInstance from "../../api/axiosInstance";
import useAuthStore from "../../store/authStore";
import { getAnalytics, getSalesAnalytics } from "../../api/analytics";

const fetchDashboardStats = async () => {
  try {
    const [products, services, blogs, orders] = await Promise.all([
      axiosInstance.get("/products?all=true"),
      axiosInstance.get("/services?all=true"),
      axiosInstance.get("/blogs?status=all"),
      axiosInstance.get("/orders"),
    ]);
    return {
      products: products.data.data.length,
      services: services.data.data.length,
      blogs: blogs.data.data.length,
      orders: orders.data.pagination.total,
      recentOrders: orders.data.data.slice(0, 5),
    };
  } catch {
    return { products: 0, services: 0, blogs: 0, orders: 0, recentOrders: [] };
  }
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌐";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
};

const SALES_RANGES = [
  { label: "1 Hari", value: "1d" },
  { label: "7 Hari", value: "7d" },
  { label: "1 Bulan", value: "30d" },
  { label: "3 Bulan", value: "90d" },
  { label: "1 Tahun", value: "1y" },
];

const VISITOR_RANGES = [
  { label: "1 Hari", value: "1d" },
  { label: "7 Hari", value: "7d" },
  { label: "1 Bulan", value: "30d" },
  { label: "3 Bulan", value: "90d" },
];

// Format label X-axis sesuai granularitas
const formatXLabel = (label, granularity) => {
  if (granularity === "hour") {
    return label; // sudah "HH:00"
  }
  if (granularity === "day") {
    const d = new Date(label);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  if (granularity === "month") {
    const [year, month] = label.split("-");
    return new Date(year, month - 1).toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    });
  }
  return label;
};

// Format tooltip label sesuai granularitas
const formatTooltipLabel = (label, granularity) => {
  if (granularity === "hour") return `Pukul ${label}`;
  if (granularity === "day") {
    return new Date(label).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (granularity === "month") {
    const [year, month] = label.split("-");
    return new Date(year, month - 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }
  return label;
};

// Format angka rupiah ringkas untuk Y-axis
const formatRupiahShort = (value) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value;
};

export default function Dashboard() {
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === "superadmin";

  const [salesRange, setSalesRange] = useState("7d");
  const [salesMetric, setSalesMetric] = useState("revenue"); // "revenue" | "items_sold"
  const [analyticsRange, setAnalyticsRange] = useState("7d");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    retry: false,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales-analytics", salesRange],
    queryFn: () => getSalesAnalytics(salesRange),
    enabled: isSuperAdmin,
    retry: false,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", analyticsRange],
    queryFn: () => getAnalytics(analyticsRange),
    enabled: isSuperAdmin,
    retry: false,
  });

  const sales = salesData?.data?.data;
  const analytics = analyticsData?.data?.data;

  const statCards = stats
    ? [
        {
          label: "Total Products",
          value: stats.products,
          icon: Package,
          color: "bg-blue-50 text-blue-600",
        },
        {
          label: "Total Services",
          value: stats.services,
          icon: Briefcase,
          color: "bg-purple-50 text-purple-600",
        },
        {
          label: "Total Blogs",
          value: stats.blogs,
          icon: FileText,
          color: "bg-green-50 text-green-600",
        },
        {
          label: "Total Orders",
          value: stats.orders,
          icon: ShoppingCart,
          color: "bg-orange-50 text-orange-600",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 animate-pulse h-24 lg:h-28"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards — 2 kolom di mobile, 4 di desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {label}
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                  {value}
                </p>
              </div>
              <div className={`p-2 lg:p-3 rounded-lg shrink-0 ${color}`}>
                <Icon size={18} className="lg:w-5.5 lg:h-5.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sales Trend — superadmin only ── */}
      {isSuperAdmin && (
        <div className="space-y-4">
          {/* Header + controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={18} className="text-brand-600" />
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                Tren Penjualan
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Metric toggle */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSalesMetric("revenue")}
                  className={`px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                    salesMetric === "revenue"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pendapatan
                </button>
                <button
                  onClick={() => setSalesMetric("items_sold")}
                  className={`px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                    salesMetric === "items_sold"
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Produk Terjual
                </button>
              </div>

              {/* Range selector */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {SALES_RANGES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSalesRange(opt.value)}
                    className={`px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                      salesRange === opt.value
                        ? "bg-white text-brand-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {salesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : sales ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3 lg:gap-4">
                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        Total Pendapatan
                      </p>
                      <p className="text-sm lg:text-base font-bold text-gray-900 truncate">
                        Rp{" "}
                        {Number(sales.summary.totalRevenue).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package size={16} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        Produk Terjual
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {sales.summary.totalItemsSold.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} className="text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        Order Dibayar
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {sales.summary.totalPaidOrders.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {salesMetric === "revenue" ? "Pendapatan" : "Produk Terjual"}{" "}
                  per{" "}
                  {sales.granularity === "hour"
                    ? "Jam"
                    : sales.granularity === "day"
                      ? "Hari"
                      : "Bulan"}
                </h3>
                <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
                  <div className="min-w-120 lg:min-w-0">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={sales.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickFormatter={(val) =>
                            formatXLabel(val, sales.granularity)
                          }
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          allowDecimals={false}
                          width={salesMetric === "revenue" ? 48 : 30}
                          tickFormatter={
                            salesMetric === "revenue"
                              ? formatRupiahShort
                              : undefined
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            salesMetric === "revenue"
                              ? [
                                  `Rp ${Number(value).toLocaleString("id-ID")}`,
                                  "Pendapatan",
                                ]
                              : [value, "Produk Terjual"]
                          }
                          labelFormatter={(label) =>
                            formatTooltipLabel(label, sales.granularity)
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey={salesMetric}
                          stroke={
                            salesMetric === "revenue" ? "#16a34a" : "#2563eb"
                          }
                          strokeWidth={2}
                          dot={sales.chartData.length <= 31}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-10 lg:p-12 text-center">
              <BarChart2 size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada data penjualan.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Visitor Analytics — superadmin only ── */}
      {isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">
                Visitor Analytics
              </h2>
            </div>

            {/* Range selector */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              {VISITOR_RANGES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnalyticsRange(opt.value)}
                  className={`px-2.5 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                    analyticsRange === opt.value
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-24 animate-pulse"
                />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                      <TrendingUp size={16} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        Total Kunjungan
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {analytics.summary.totalVisits.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 lg:p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                      <Users size={16} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 truncate">
                        Unique Visitor
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {analytics.summary.uniqueVisitors.toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Chart — scroll horizontal di mobile */}
              <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Kunjungan Harian
                </h3>
                <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
                  <div className="min-w-120 lg:min-w-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.dailyVisits}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          tickFormatter={(val) => {
                            const d = new Date(val);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          allowDecimals={false}
                          width={30}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "total"
                              ? "Total Kunjungan"
                              : "Unique Visitor",
                          ]}
                          labelFormatter={(label) => {
                            const d = new Date(label);
                            return d.toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            });
                          }}
                        />
                        <Legend
                          formatter={(val) =>
                            val === "total"
                              ? "Total Kunjungan"
                              : "Unique Visitor"
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="unique"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                          strokeDasharray="4 2"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Weekly chart */}
              {analytics.weeklyVisits?.length > 0 && (
                <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Kunjungan Mingguan
                  </h3>
                  <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
                    <div className="min-w-100 lg:min-w-0">
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={analytics.weeklyVisits}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            tickFormatter={(val) => {
                              const d = new Date(val);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                            allowDecimals={false}
                            width={30}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              value,
                              name === "total" ? "Total" : "Unique",
                            ]}
                            labelFormatter={(label) =>
                              `Minggu ${new Date(label).toLocaleDateString("id-ID")}`
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="unique"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            strokeDasharray="4 2"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Countries */}
              {analytics.topCountries?.length > 0 && (
                <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={15} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      Asal Pengunjung
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analytics.topCountries.map((country) => (
                      <div
                        key={country.country_code}
                        className="flex items-center gap-3"
                      >
                        <span className="text-base lg:text-lg w-6 lg:w-7 text-center shrink-0">
                          {getFlagEmoji(country.country_code)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1 gap-2">
                            <span className="text-xs lg:text-sm font-medium text-gray-700 truncate">
                              {country.country_name || country.country_code}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {country.count} ({country.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${country.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl p-10 lg:p-12 text-center">
              <TrendingUp size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Belum ada data kunjungan.</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h2>
        {!stats?.recentOrders?.length ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
            <table className="w-full text-sm min-w-120">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Order Number</th>
                  <th className="pb-3 font-medium">Buyer</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-mono text-xs text-gray-600">
                      {order.order_number}
                    </td>
                    <td className="py-3 text-gray-700 max-w-30 truncate">
                      {order.buyer_name}
                    </td>
                    <td className="py-3 text-gray-700 whitespace-nowrap">
                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
