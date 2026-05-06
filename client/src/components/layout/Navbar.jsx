import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, getPageSettings } from "../../api/settings";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const { data: pagesData } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings,
    staleTime: 1000 * 60 * 10,
  });

  const settings = siteData?.data?.data || {};
  const pages = pagesData?.data?.data || [];

  // Hanya tampilkan halaman yang aktif, urutan dari sort_order
  const navLinks = pages
    .filter((p) => p.is_active && p.page_key !== "home")
    .map((p) => ({
      label: p.navbar_label,
      to: `/${p.page_key}`,
    }));

  const siteName = settings.site_name || "CompanyName";
  const logoUrl = settings.navbar_logo_url;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo atau text */}
          <Link to="/" className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="font-bold text-xl text-slate-900">
                <span className="text-brand-600">
                  {siteName.slice(0, Math.ceil(siteName.length / 2))}
                </span>
                {siteName.slice(Math.ceil(siteName.length / 2))}
              </span>
            )}
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-8">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-brand-600"
                    : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              {pages.find((p) => p.page_key === "home")?.navbar_label || "Home"}
            </NavLink>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-brand-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <NavLink
                to="/"
                end
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`
                }
              >
                {pages.find((p) => p.page_key === "home")?.navbar_label ||
                  "Home"}
              </NavLink>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
