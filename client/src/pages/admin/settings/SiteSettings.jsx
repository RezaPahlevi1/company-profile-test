import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const showLogo = settings.navbar_logo_url && settings.navbar_logo_url !== "";

  if (siteLoading || pagesLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="h-8 w-40 bg-white rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header — sama dengan halaman admin lain */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
          Site Settings
        </h1>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Globe size={18} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Branding</h2>
        </div>

        <div className="space-y-4">
          {/* Nama Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Website
            </label>
            <input
              value={form.site_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, site_name: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="CompanyName"
            />
          </div>

          {/* Deskripsi */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi Website
            </label>
            <textarea
              value={form.site_description}
              onChange={(e) =>
                setForm((f) => ({ ...f, site_description: e.target.value }))
              }
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Solusi digital terpercaya..."
            />
          </div> */}

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo Navbar
            </label>
            {settings.navbar_logo_url ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <img
                  src={settings.navbar_logo_url}
                  alt="Logo"
                  className="h-12 w-auto object-contain border border-gray-200 rounded-lg p-1 self-start"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Upload size={14} />
                    {isUploadingLogo ? "Mengupload..." : "Ganti Logo"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteLogo(true)}
                    className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
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
                  className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
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

          {/* Toggle tampilkan nama perusahaan */}
          {showLogo && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Tampilkan nama perusahaan
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Tampilkan teks nama di sebelah logo
                </p>
              </div>
              <button
                onClick={() => {
                  const newVal =
                    settings.show_site_name === "false" ? "true" : "false";
                  saveSiteSettings({ show_site_name: newVal });
                }}
                className="shrink-0 ml-4"
              >
                {settings.show_site_name !== "false" ? (
                  <ToggleRight size={28} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-400" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pembayaran & Estimasi */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            Pembayaran & Estimasi
          </h2>
        </div>

        <div className="space-y-4">
          {/* Batas waktu pembayaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={13} className="inline mr-1.5 -mt-0.5" />
              Batas Waktu Pembayaran (jam)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
                className="w-full sm:w-32 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">
                {form.payment_expiry_hours} jam ={" "}
                {(Number(form.payment_expiry_hours) / 24).toFixed(1)} hari
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Berlaku untuk semua order baru. Pembayaran yang melewati batas
              akan otomatis gagal di Midtrans.
            </p>
          </div>

          {/* Estimasi penyelesaian */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimasi Penyelesaian
            </label>
            <input
              value={form.delivery_estimation}
              onChange={(e) =>
                setForm((f) => ({ ...f, delivery_estimation: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: 3-5 hari kerja"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Ditampilkan di email konfirmasi pembayaran berhasil.
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Simpan */}
      <div className="flex justify-end">
        <button
          onClick={() => saveSiteSettings(form)}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Save size={16} />
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      {/* Halaman Publik */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Layout size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Halaman Publik
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Nonaktifkan halaman agar tidak bisa diakses publik.
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
      </div>

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
      className={`p-3 rounded-xl border transition-colors ${
        page.is_active
          ? "border-gray-100 bg-gray-50"
          : "border-dashed border-gray-200 bg-white opacity-60"
      }`}
    >
      {/* Baris atas: label + toggle */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
          /{page.page_key}
        </span>
        <button
          onClick={() => !isHome && onUpdate({ is_active: !page.is_active })}
          disabled={isHome}
          title={isHome ? "Home tidak bisa dinonaktifkan" : ""}
          className={`shrink-0 transition-colors ${isHome ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {page.is_active ? (
            <ToggleRight size={26} className="text-blue-600" />
          ) : (
            <ToggleLeft size={26} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Baris bawah: dua kolom edit — stack di mobile, grid di sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Browser title */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Browser title</p>
          {editTitle ? (
            <div className="flex gap-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setTitle(page.title);
                  setEditTitle(false);
                }}
                className="px-2.5 py-1.5 bg-gray-200 rounded-lg text-xs font-medium"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditTitle(true)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
            >
              {page.title} <span className="text-gray-400 text-xs">✎</span>
            </button>
          )}
        </div>

        {/* Label navbar */}
        <div>
          <p className="text-xs text-gray-400 mb-1">Label navbar</p>
          {editLabel ? (
            <div className="flex gap-1">
              <input
                value={navbarLabel}
                onChange={(e) => setNavbarLabel(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
                autoFocus
              />
              <button
                onClick={handleSaveLabel}
                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setNavbarLabel(page.navbar_label);
                  setEditLabel(false);
                }}
                className="px-2.5 py-1.5 bg-gray-200 rounded-lg text-xs font-medium"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditLabel(true)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
            >
              {page.navbar_label}{" "}
              <span className="text-gray-400 text-xs">✎</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
