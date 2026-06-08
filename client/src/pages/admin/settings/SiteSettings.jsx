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
  MessageCircle,
  AlignLeft,
  Video,
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
import { Link } from "react-router-dom";

const ALWAYS_ACTIVE = ["home"];

const formatMinutes = (total) => {
  const mins = Number(total);
  if (isNaN(mins) || mins <= 0) return "";
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hours === 0) return `${remaining} menit`;
  if (remaining === 0) return `${hours} jam`;
  return `${hours} jam ${remaining} menit`;
};

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
    payment_expiry_minutes: "1440",
    delivery_estimation: "",
    bank_account_info: "",
    manual_payment_verification_hours: "",
    manual_payment_expiry_minutes: "4320",
  });

  const [footerForm, setFooterForm] = useState({
    footer_tagline: "",
    footer_cta_title: "",
    footer_cta_body: "",
    footer_video_url: "",
  });

  const [videoError, setVideoError] = useState("");

  useEffect(() => {
    if (settings.site_name !== undefined) {
      setForm({
        site_name: settings.site_name || "",
        payment_expiry_minutes: settings.payment_expiry_minutes || "1440",
        delivery_estimation: settings.delivery_estimation || "",
        bank_account_info: settings.bank_account_info || "",
        manual_payment_verification_hours:
          settings.manual_payment_verification_hours || "",
        manual_payment_expiry_minutes:
          settings.manual_payment_expiry_minutes || "4320",
      });
      setFooterForm({
        footer_tagline: settings.footer_tagline || "",
        footer_cta_title: settings.footer_cta_title || "",
        footer_cta_body: settings.footer_cta_body || "",
        footer_video_url: settings.footer_video_id || "",
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

  const { mutate: saveFooterSettings, isPending: isSavingFooter } = useMutation(
    {
      mutationFn: updateSiteSettings,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["site-settings"] });
        toast.success("Footer settings saved");
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Failed to save"),
    },
  );

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

  const handleVideoUrlChange = (e) => {
    const val = e.target.value;
    setFooterForm((f) => ({ ...f, footer_video_url: val }));
    if (val === "") {
      setVideoError("");
      return;
    }
    const isYoutube =
      /youtube\.com\/watch/.test(val) ||
      /youtu\.be\//.test(val) ||
      /youtube\.com\/embed\//.test(val) ||
      /^[a-zA-Z0-9_-]{11}$/.test(val.trim());
    setVideoError(isYoutube ? "" : "Masukkan URL YouTube yang valid");
  };

  const handleSave = () => {
    const mins = Number(form.payment_expiry_minutes);
    if (isNaN(mins) || mins < 1 || mins > 1440) {
      toast.error("Batas waktu pembayaran harus antara 1 hingga 1440 menit");
      return;
    }
    const manualMinutes = Number(form.manual_payment_expiry_minutes);
    if (isNaN(manualMinutes) || manualMinutes < 1 || manualMinutes > 1440) {
      toast.error(
        "Batas waktu pembayaran manual harus antara 1 hingga 1440 menit (24 jam)",
      );
      return;
    }
    saveSiteSettings(form);
  };

  const handleSaveFooter = () => {
    if (videoError) return;
    saveFooterSettings({
      footer_tagline: footerForm.footer_tagline,
      footer_cta_title: footerForm.footer_cta_title,
      footer_cta_body: footerForm.footer_cta_body,
      footer_video_url: footerForm.footer_video_url,
    });
  };

  const getPreviewVideoId = (val) => {
    if (!val) return null;
    const v = val.trim();
    const m =
      v.match(/(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/) ||
      v.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
      v.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    return null;
  };

  const showLogo = settings.navbar_logo_url && settings.navbar_logo_url !== "";
  const showWhatsapp = settings.show_whatsapp !== "false";
  const showFooterVideo = settings.show_footer_video !== "false";

  if (siteLoading || pagesLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="h-8 w-40 bg-white rounded-xl animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
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

      {/* WhatsApp — hanya toggle show/hide, nomor dikelola di Company Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <MessageCircle size={18} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">WhatsApp</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              To update the number, go to{" "}
              <Link
                to="/admin/settings/company"
                className="text-blue-600 hover:underline"
              >
                Company Info
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Tampilkan di navbar
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tampilkan tombol WhatsApp di navbar dan menu mobile
            </p>
          </div>
          <button
            onClick={() => {
              const newVal = showWhatsapp ? "false" : "true";
              saveSiteSettings({ show_whatsapp: newVal });
            }}
            className="shrink-0 ml-4"
          >
            {showWhatsapp ? (
              <ToggleRight size={28} className="text-blue-600" />
            ) : (
              <ToggleLeft size={28} className="text-gray-400" />
            )}
          </button>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={13} className="inline mr-1.5 -mt-0.5" />
              Batas Waktu Pembayaran (menit)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="number"
                min="1"
                max="1440"
                value={form.payment_expiry_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_expiry_minutes: e.target.value,
                  }))
                }
                className="w-full sm:w-32 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.payment_expiry_minutes && (
                <span className="text-sm text-gray-500">
                  = {formatMinutes(form.payment_expiry_minutes)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Antara 1 menit hingga 1440 menit (24 jam). Berlaku untuk semua
              order baru.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={13} className="inline mr-1.5 -mt-0.5" />
              Batas Waktu Pembayaran Manual (menit)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="number"
                min="1"
                max="1440"
                value={form.manual_payment_expiry_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    manual_payment_expiry_minutes: e.target.value,
                  }))
                }
                className="w-full sm:w-32 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {form.manual_payment_expiry_minutes && (
                <span className="text-sm text-gray-500">
                  = {formatMinutes(form.manual_payment_expiry_minutes)}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Antara 1 menit hingga 1440 menit (24 jam). Order manual yang
              melewati batas ini akan otomatis gagal.
            </p>
          </div>

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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Informasi Rekening Bank (Manual Payment)
          </label>
          <textarea
            value={form.bank_account_info || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, bank_account_info: e.target.value }))
            }
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder={
              "BCA: 1234567890 a.n. PT Company\nMandiri: 0987654321 a.n. PT Company"
            }
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Ditampilkan kepada pembeli yang memilih bayar manual. Kosongkan
            untuk menonaktifkan opsi manual payment.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimasi Verifikasi Manual Payment
          </label>
          <input
            value={form.manual_payment_verification_hours || ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                manual_payment_verification_hours: e.target.value,
              }))
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contoh: 1x24 jam kerja"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Ditampilkan di halaman status order sebagai estimasi waktu
            konfirmasi.
          </p>
        </div>
      </div>

      {/* Tombol Simpan */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Save size={16} />
          {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      {/* Footer Settings */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <AlignLeft size={18} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Footer</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tagline Brand
            </label>
            <input
              value={footerForm.footer_tagline}
              onChange={(e) =>
                setFooterForm((f) => ({ ...f, footer_tagline: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Solusi digital terpercaya untuk bisnis Anda."
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul CTA
            </label>
            <input
              value={footerForm.footer_cta_title}
              onChange={(e) =>
                setFooterForm((f) => ({
                  ...f,
                  footer_cta_title: e.target.value,
                }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Siap Berdiskusi?"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teks CTA
            </label>
            <textarea
              value={footerForm.footer_cta_body}
              onChange={(e) =>
                setFooterForm((f) => ({
                  ...f,
                  footer_cta_body: e.target.value,
                }))
              }
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Kami siap membantu menjawab pertanyaan dan kebutuhan bisnis Anda."
              maxLength={300}
            />
          </div>

          {/* Video YouTube */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Video size={16} className="text-red-500" />
              <p className="text-sm font-medium text-gray-700">Video YouTube</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Video
              </label>
              <input
                value={footerForm.footer_video_url}
                onChange={handleVideoUrlChange}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  videoError ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="https://youtube.com/watch?v=... atau https://youtu.be/..."
              />
              {videoError ? (
                <p className="text-red-500 text-xs mt-1">{videoError}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">
                  Mendukung format youtube.com/watch, youtu.be, atau video ID
                  langsung. Kosongkan untuk menghapus video.
                </p>
              )}
            </div>

            {footerForm.footer_video_url && !videoError && (
              <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Video ID:{" "}
                  <span className="font-mono text-gray-700">
                    {getPreviewVideoId(footerForm.footer_video_url) || "—"}
                  </span>
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mt-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Tampilkan video di footer
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Video hanya tampil jika URL sudah diisi
                </p>
              </div>
              <button
                onClick={() => {
                  const newVal = showFooterVideo ? "false" : "true";
                  saveSiteSettings({ show_footer_video: newVal });
                }}
                className="shrink-0 ml-4"
              >
                {showFooterVideo ? (
                  <ToggleRight size={28} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={28} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleSaveFooter}
            disabled={isSavingFooter || !!videoError}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Save size={16} />
            {isSavingFooter ? "Menyimpan..." : "Simpan Footer"}
          </button>
        </div>
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
              alwaysActive={ALWAYS_ACTIVE.includes(page.page_key)}
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

const PageRow = ({ page, alwaysActive, onUpdate }) => {
  const [editTitle, setEditTitle] = useState(false);
  const [editLabel, setEditLabel] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [navbarLabel, setNavbarLabel] = useState(page.navbar_label);

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

  const toggleTitle = alwaysActive
    ? "Home tidak bisa dinonaktifkan"
    : undefined;

  return (
    <div
      className={`p-3 rounded-xl border transition-colors ${
        page.is_active
          ? "border-gray-100 bg-gray-50"
          : "border-dashed border-gray-200 bg-white opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
          /{page.page_key}
        </span>
        <button
          onClick={() =>
            !alwaysActive && onUpdate({ is_active: !page.is_active })
          }
          disabled={alwaysActive}
          title={toggleTitle}
          className={`shrink-0 transition-colors ${alwaysActive ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {page.is_active ? (
            <ToggleRight size={26} className="text-blue-600" />
          ) : (
            <ToggleLeft size={26} className="text-gray-400" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
