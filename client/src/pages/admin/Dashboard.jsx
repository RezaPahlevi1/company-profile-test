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
import { getAnalytics } from "../../api/analytics";

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
      orders: orders.data.data.length,
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

// Flag emoji dari kode negara
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌐";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
};

export default function Dashboard() {
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === "superadmin";
  const [analyticsRange, setAnalyticsRange] = useState("7d");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    retry: false,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", analyticsRange],
    queryFn: () => getAnalytics(analyticsRange),
    enabled: isSuperAdmin,
    retry: false,
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 animate-pulse h-28"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Section — Superadmin only */}
      {isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Visitor Analytics
              </h2>
            </div>

            {/* Range selector */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { label: "7 Hari", value: "7d" },
                { label: "30 Hari", value: "30d" },
                { label: "90 Hari", value: "90d" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnalyticsRange(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-32 animate-pulse"
                />
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <TrendingUp size={18} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Kunjungan</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.summary.totalVisits.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Users size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Unique Visitor</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.summary.uniqueVisitors.toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Kunjungan Harian
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.dailyVisits}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "total" ? "Total Kunjungan" : "Unique Visitor",
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
                        val === "total" ? "Total Kunjungan" : "Unique Visitor"
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

              {/* Weekly & Monthly — hanya kalau range cukup */}
              {analytics.weeklyVisits?.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Kunjungan Mingguan
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={analytics.weeklyVisits}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        allowDecimals={false}
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
              )}

              {/* Top Countries */}
              {analytics.topCountries?.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={16} className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      Asal Pengunjung
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {analytics.topCountries.map((country, i) => (
                      <div
                        key={country.country_code}
                        className="flex items-center gap-3"
                      >
                        <span className="text-lg w-7 text-center">
                          {getFlagEmoji(country.country_code)}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {country.country_name || country.country_code}
                            </span>
                            <span className="text-xs text-gray-400">
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
            <div className="bg-white rounded-xl p-12 text-center">
              <TrendingUp size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada data kunjungan.</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h2>
        {!stats?.recentOrders?.length ? (
          <p className="text-gray-400 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                    <td className="py-3 text-gray-700">{order.buyer_name}</td>
                    <td className="py-3 text-gray-700">
                      Rp {Number(order.total_amount).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
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
