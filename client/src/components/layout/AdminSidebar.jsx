import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Briefcase,
  FileText,
  ShoppingCart,
  Settings,
  LogOut,
  Mail,
  X,
  Layout,
  Users,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { logoutAdmin } from "../../api/auth";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const navItems = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin"],
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: Package,
    roles: ["superadmin"],
  },
  {
    label: "Services",
    to: "/admin/services",
    icon: Briefcase,
    roles: ["superadmin"],
  },
  {
    label: "Blogs",
    to: "/admin/blogs",
    icon: FileText,
    roles: ["superadmin", "admin_konten"],
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: ShoppingCart,
    roles: ["superadmin", "admin_order"],
  },
  {
    label: "Site Settings",
    to: "/admin/settings/site",
    icon: Settings,
    roles: ["superadmin"],
  },
  {
    label: "Admins",
    to: "/admin/settings/admins",
    icon: Users,
    roles: ["superadmin"],
  },
  {
    label: "Email Settings",
    to: "/admin/settings/email",
    icon: Mail,
    roles: ["superadmin"],
  },
  // ✅ Ganti icon ke Layout agar berbeda dari Dashboard
  {
    label: "Builder (Home)",
    to: "/admin/builder/home",
    icon: Layout,
    roles: ["superadmin"],
  },
  {
    label: "Builder (About)",
    to: "/admin/builder/about",
    icon: Layout,
    roles: ["superadmin"],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const { admin, clearAdmin } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch {
      // tetap lanjut logout
    } finally {
      queryClient.clear();
      clearAdmin();
      navigate("/admin/login");
      toast.success("Logged out successfully");
    }
  };

  // ✅ Tidak ada fallback || "superadmin"
  // Jika role belum ter-hydrate → filteredNavItems kosong sementara
  const role = admin?.role;
  const filteredNavItems = role
    ? navItems.filter((item) => item.roles.includes(role))
    : [];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-300 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:z-auto
      `}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-white font-semibold text-lg">Admin Panel</p>
          <p className="text-xs text-gray-500 mt-1 truncate">{admin?.name}</p>
          {role && (
            <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 bg-gray-800 rounded text-gray-400 border border-gray-700">
              {role.replace("_", " ")}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors shrink-0 ml-2"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
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

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800 shrink-0">
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
