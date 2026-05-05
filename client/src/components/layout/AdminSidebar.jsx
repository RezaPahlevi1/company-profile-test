import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Briefcase,
  FileText,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { logoutAdmin } from "../../api/auth";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, roles: ['superadmin'] },
  { label: "Products", to: "/admin/products", icon: Package, roles: ['superadmin'] },
  { label: "Services", to: "/admin/services", icon: Briefcase, roles: ['superadmin'] },
  { label: "Blogs", to: "/admin/blogs", icon: FileText, roles: ['superadmin', 'admin_konten'] },
  { label: "Orders", to: "/admin/orders", icon: ShoppingCart, roles: ['superadmin', 'admin_order'] },
  { label: "Admins", to: "/admin/settings/admins", icon: Settings, roles: ['superadmin'] },
];

export default function AdminSidebar() {
  const { admin, clearAdmin } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      clearAdmin();
      navigate("/admin/login");
      toast.success("Logged out successfully");
    } catch {
      clearAdmin();
      navigate("/admin/login");
    } finally {
      queryClient.clear(); // ← clear semua cache React Query
      clearAdmin(); // ← clear Zustand store
      navigate("/admin/login");
      toast.success("Logged out successfully");
    }
  };

  const role = admin?.role || 'superadmin';
  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-gray-300 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <p className="text-white font-semibold text-lg">Admin Panel</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{admin?.name}</p>
        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-800 rounded text-gray-400 border border-gray-700">
          {role.replace('_', ' ')}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
