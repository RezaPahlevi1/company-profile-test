import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  Upload,
  Trash2,
  Globe,
  Layout,
  CreditCard,
  Clock,
  Image,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getSiteSettings,
  updateSiteSettings,
  uploadLogo,
  deleteLogo,
  getPageSettings,
  updatePageSetting,
} from "../../../api/settings";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import { useEffect } from "react";

export default function SiteSettings() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef(null);
  const [confirmDeleteLogo, setConfirmDeleteLogo] = useState(false);

  const { data: siteData, isLoading: siteLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
  });

  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings,
  });

  const settings = siteData?.data?.data || {};
  const pages = pagesData?.data?.data || [];

  const [form, setForm] = useState({
    site_name: "",
    site_description: "",
    payment_expiry_hours: "24",
    delivery_estimation: "",
  });

  // Sync form dengan data dari server
  useState(() => {
    if (settings.site_name !== undefined) {
      setForm({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        payment_expiry_hours: settings.payment_expiry_hours || "24",
        delivery_estimation: settings.delivery_estimation || "",
      });
    }
  }, [settings]);

  // Gunakan useEffect untuk sync
  useEffect(() => {
    if (settings.site_name !== undefined) {
      setForm({
        site_name: settings.site_name || "",
        site_description: settings.site_description || "",
        payment_expiry_hours: settings.payment_expiry_hours || "24",
        delivery_estimation: settings.delivery_estimation || "",
      });
    }
  }, [siteData]);

  const { mutate: saveSiteSettings, isPending: isSaving } = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save"),
  });

  const { mutate: doUploadLogo, isPending: isUploadingLogo } = useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Logo uploaded");
    },
    onError: () => toast.error("Failed to upload logo"),
  });

  const { mutate: doDeleteLogo, isPending: isDeletingLogo } = useMutation({
    mutationFn: deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      setConfirmDeleteLogo(false);
      toast.success("Logo removed");
    },
    onError: () => toast.error("Failed to remove logo"),
  });

  const { mutate: doUpdatePage } = useMutation({
    mutationFn: ({ key, data }) => updatePageSetting(key, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-settings"] });
      toast.success("Page setting updated");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update"),
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) doUploadLogo(file);
  };

  if (siteLoading || pagesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
            <Globe size={18} className="text-brand-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Branding</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Website
            </label>
            <input
              value={form.site_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, site_name: e.target.value }))
              }
              className="input-base"
              placeholder="CompanyName"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deskripsi Website
            </label>
            <textarea
              value={form.site_description}
              onChange={(e) =>
                setForm((f) => ({ ...f, site_description: e.target.value }))
              }
              rows={2}
              className="input-base resize-none"
              placeholder="Solusi digital terpercaya..."
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Logo Navbar
            </label>
            {settings.navbar_logo_url ? (
              <div className="flex items-center gap-4">
                <img
                  src={settings.navbar_logo_url}
                  alt="Logo"
                  className="h-12 w-auto object-contain border border-gray-200 rounded-lg p-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="btn-outline text-sm py-2 px-3"
                  >
                    <Upload size={14} />
                    Ganti Logo
                  </button>
                  <button
                    onClick={() => setConfirmDeleteLogo(true)}
                    className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="btn-outline text-sm"
                >
                  <Image size={14} />
                  {isUploadingLogo ? "Mengupload..." : "Upload Logo"}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">
                  PNG, SVG, atau WebP. Rekomendasi tinggi 40px. Max 5MB.
                </p>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </motion.div>

      {/* Payment & Estimasi */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
            <CreditCard size={18} className="text-brand-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            Pembayaran & Estimasi
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Clock size={14} className="inline mr-1.5" />
              Batas Waktu Pembayaran (jam)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="168"
                value={form.payment_expiry_hours}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_expiry_hours: e.target.value,
                  }))
                }
                className="input-base w-32"
              />
              <span className="text-sm text-gray-500">
                jam ({form.payment_expiry_hours} jam ={" "}
                {(Number(form.payment_expiry_hours) / 24).toFixed(1)} hari)
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Berlaku untuk semua order baru. Pembayaran yang melewati batas
              akan otomatis gagal di Midtrans.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Estimasi Penyelesaian
            </label>
            <input
              value={form.delivery_estimation}
              onChange={(e) =>
                setForm((f) => ({ ...f, delivery_estimation: e.target.value }))
              }
              className="input-base"
              placeholder="Contoh: 3-5 hari kerja"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Ditampilkan di email konfirmasi pembayaran berhasil.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tombol simpan branding + payment */}
      <div className="flex justify-end">
        <button
          onClick={() => saveSiteSettings(form)}
          disabled={isSaving}
          className="btn-primary"
        >
          <Save size={16} />
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      {/* Halaman Publik */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
            <Layout size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Halaman Publik
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Nonaktifkan halaman agar tidak bisa diakses publik. Urutan tidak
              berubah.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {pages.map((page) => (
            <PageRow
              key={page.page_key}
              page={page}
              onUpdate={(data) => doUpdatePage({ key: page.page_key, data })}
            />
          ))}
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={confirmDeleteLogo}
        title="Hapus Logo"
        message="Logo akan dihapus dan navbar akan menampilkan nama website dalam bentuk teks."
        variant="danger"
        confirmLabel="Hapus Logo"
        onConfirm={() => doDeleteLogo()}
        onCancel={() => setConfirmDeleteLogo(false)}
        isLoading={isDeletingLogo}
      />
    </div>
  );
}

// Komponen per baris halaman
const PageRow = ({ page, onUpdate }) => {
  const [editTitle, setEditTitle] = useState(false);
  const [editLabel, setEditLabel] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [navbarLabel, setNavbarLabel] = useState(page.navbar_label);
  const isHome = page.page_key === "home";

  const handleSaveTitle = () => {
    if (title.trim()) {
      onUpdate({ title: title.trim() });
      setEditTitle(false);
    }
  };

  const handleSaveLabel = () => {
    if (navbarLabel.trim()) {
      onUpdate({ navbar_label: navbarLabel.trim() });
      setEditLabel(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${
        page.is_active
          ? "border-gray-100 bg-gray-50"
          : "border-dashed border-gray-200 bg-white opacity-60"
      }`}
    >
      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* Title */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Browser title</p>
          {editTitle ? (
            <div className="flex gap-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base text-xs py-1.5 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-2 py-1.5 bg-brand-600 text-white rounded-lg text-xs"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setTitle(page.title);
                  setEditTitle(false);
                }}
                className="px-2 py-1.5 bg-gray-200 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditTitle(true)}
              className="text-sm font-medium text-gray-900 hover:text-brand-600 transition-colors text-left"
            >
              {page.title} ✎
            </button>
          )}
        </div>

        {/* Navbar label */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Label navbar</p>
          {editLabel ? (
            <div className="flex gap-1">
              <input
                value={navbarLabel}
                onChange={(e) => setNavbarLabel(e.target.value)}
                className="input-base text-xs py-1.5 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
                autoFocus
              />
              <button
                onClick={handleSaveLabel}
                className="px-2 py-1.5 bg-brand-600 text-white rounded-lg text-xs"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setNavbarLabel(page.navbar_label);
                  setEditLabel(false);
                }}
                className="px-2 py-1.5 bg-gray-200 rounded-lg text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditLabel(true)}
              className="text-sm font-medium text-gray-900 hover:text-brand-600 transition-colors text-left"
            >
              {page.navbar_label} ✎
            </button>
          )}
        </div>
      </div>

      {/* Toggle aktif */}
      <button
        onClick={() => !isHome && onUpdate({ is_active: !page.is_active })}
        disabled={isHome}
        title={isHome ? "Home tidak bisa dinonaktifkan" : ""}
        className={`shrink-0 transition-colors ${isHome ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {page.is_active ? (
          <ToggleRight size={28} className="text-brand-600" />
        ) : (
          <ToggleLeft size={28} className="text-gray-400" />
        )}
      </button>
    </div>
  );
};
