import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  Tag,
  ChevronDown,
  Building2,
  ScrollText,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import { logoutAdmin } from "../../api/auth";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

// ==================== STRUKTUR NAV ====================

const standaloneItems = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
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
];

const navGroups = [
  {
    id: "katalog",
    label: "Katalog",
    icon: Package,
    roles: ["superadmin"],
    items: [
      { label: "Products", to: "/admin/products", icon: Package },
      { label: "Services", to: "/admin/services", icon: Briefcase },
      { label: "Promo", to: "/admin/promo", icon: Tag },
    ],
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    icon: Settings,
    roles: ["superadmin"],
    items: [
      { label: "Site Settings", to: "/admin/settings/site", icon: Settings },
      { label: "Company Info", to: "/admin/settings/company", icon: Building2 },
      {
        label: "Terms & Conditions",
        to: "/admin/settings/terms",
        icon: ScrollText,
      },
      { label: "Admins", to: "/admin/settings/admins", icon: Users },
      { label: "Email Settings", to: "/admin/settings/email", icon: Mail },
    ],
  },
  {
    id: "builder",
    label: "Page Builder",
    icon: Layout,
    roles: ["superadmin"],
    items: [
      { label: "Home", to: "/admin/builder/home", icon: Layout },
      { label: "About", to: "/admin/builder/about", icon: Layout },
    ],
  },
];

// ==================== SUB KOMPONEN ====================

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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
  );
}

function NavGroup({ group, onItemClick }) {
  const location = useLocation();

  const isAnyChildActive = group.items.some((item) =>
    location.pathname.startsWith(item.to),
  );

  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isAnyChildActive
            ? "text-white bg-gray-800"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
      >
        <group.icon size={18} className="shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          size={15}
          className={`shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-1 ml-3 pl-3 border-l border-gray-700 space-y-0.5 py-1">
          {group.items.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== KOMPONEN UTAMA ====================

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

  const role = admin?.role;

  const filteredStandalone = role
    ? standaloneItems.filter((item) => item.roles.includes(role))
    : [];

  const filteredGroups = role
    ? navGroups.filter((group) => group.roles.includes(role))
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
        {filteredStandalone.map(({ label, to, icon: Icon }) => (
          <NavItem
            key={to}
            to={to}
            icon={Icon}
            label={label}
            onClick={onClose}
          />
        ))}

        {filteredStandalone.length > 0 && filteredGroups.length > 0 && (
          <div className="pt-2 pb-1">
            <div className="border-t border-gray-800" />
          </div>
        )}

        {filteredGroups.map((group) => (
          <NavGroup key={group.id} group={group} onItemClick={onClose} />
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
