import { useQuery } from "@tanstack/react-query";
import { Package, Briefcase, FileText, ShoppingCart } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

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
  } catch (err) {
    // Kalau 401, biarkan interceptor axios yang handle redirect
    // Jangan throw agar tidak crash dashboard
    if (err.response?.status === 401) {
      return {
        products: 0,
        services: 0,
        blogs: 0,
        orders: 0,
        recentOrders: [],
      };
    }
    throw err;
  }
};

const statCards = (stats) => [
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
];

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    retry: false,
  });

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards(stats).map(({ label, value, icon: Icon, color }) => (
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

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h2>
        {stats.recentOrders.length === 0 ? (
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
