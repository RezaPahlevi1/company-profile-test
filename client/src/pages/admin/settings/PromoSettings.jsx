import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPromoSettings,
  updatePromoSettings,
  uploadPromoBanner,
  deletePromoBanner,
} from "../../../api/settings";
import axiosInstance from "../../../api/axiosInstance";

const getActivePromos = () => axiosInstance.get("/promos");
import toast from "react-hot-toast";
import {
  Tag,
  Upload,
  Trash2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ImageOff,
  Package,
  Briefcase,
  Info,
  AlertCircle,
} from "lucide-react";
import Spinner from "../../../components/ui/Spinner";
import { Link } from "react-router-dom";

export default function PromoSettings() {
  const queryClient = useQueryClient();
  const bannerInputRef = useRef(null);

  const [form, setForm] = useState({
    show_promo: "false",
    promo_title: "",
    promo_description: "",
    promo_starts_at: "",
    promo_ends_at: "",
  });
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch pengaturan kampanye
  const { data: settingsData, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["promo-settings"],
    queryFn: getPromoSettings,
  });

  // Fetch data promo aktif — untuk preview produk & service
  const { data: promoData, isLoading: isPromoLoading } = useQuery({
    queryKey: ["active-promos"],
    queryFn: getActivePromos,
    // Selalu fetch fresh di halaman admin agar data terkini
    staleTime: 0,
  });

  // Hydrate form dari settings
  useEffect(() => {
    const s = settingsData?.data?.data;
    if (!s) return;
    setForm({
      show_promo: s.show_promo || "false",
      promo_title: s.promo_title || "",
      promo_description: s.promo_description || "",
      // Konversi ISO ke format yyyy-MM-dd untuk input[type=date]
      promo_starts_at: s.promo_starts_at ? s.promo_starts_at.slice(0, 10) : "",
      promo_ends_at: s.promo_ends_at ? s.promo_ends_at.slice(0, 10) : "",
    });
    setBannerPreview(s.promo_banner_url || null);
  }, [settingsData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  // Mutasi simpan settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      // Upload banner dulu jika ada file baru
      if (bannerFile) {
        await uploadPromoBanner(bannerFile);
        setBannerFile(null);
      }
      // Simpan settings teks
      await updatePromoSettings({
        show_promo: form.show_promo,
        promo_title: form.promo_title,
        promo_description: form.promo_description,
        promo_starts_at: form.promo_starts_at || "",
        promo_ends_at: form.promo_ends_at || "",
      });
    },
    onSuccess: () => {
      toast.success("Pengaturan promo disimpan");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["promo-settings"] });
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Gagal menyimpan pengaturan");
    },
  });

  // Mutasi hapus banner
  const { mutate: removeBanner, isPending: isRemovingBanner } = useMutation({
    mutationFn: deletePromoBanner,
    onSuccess: () => {
      toast.success("Banner dihapus");
      setBannerPreview(null);
      setBannerFile(null);
      queryClient.invalidateQueries({ queryKey: ["promo-settings"] });
      queryClient.invalidateQueries({ queryKey: ["active-promos"] });
    },
    onError: () => toast.error("Gagal menghapus banner"),
  });

  const handleRemoveBanner = () => {
    // Jika hanya preview lokal (belum upload), reset saja
    if (bannerFile) {
      setBannerFile(null);
      setBannerPreview(settingsData?.data?.data?.promo_banner_url || null);
      setIsDirty(false);
      return;
    }
    removeBanner();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi tanggal di frontend
    if (form.promo_starts_at && form.promo_ends_at) {
      if (new Date(form.promo_starts_at) >= new Date(form.promo_ends_at)) {
        toast.error("Tanggal mulai harus sebelum tanggal berakhir");
        return;
      }
    }

    saveSettings();
  };

  // Data produk & service promo dari cache
  const rawPromo = promoData?.data?.data;
  // Di halaman admin, kita ambil langsung dari endpoint settings
  // bukan dari getActivePromos (yg tergantung status kampanye)
  // Jadi kita query produk/service is_promo dari settings endpoint
  // Tapi karena getActivePromos return kosong jika tidak aktif,
  // kita gunakan data dari settingsData untuk banner/teks
  // dan tampilkan info produk dari promoData jika ada,
  // dengan fallback ke pesan informatif
  const promoProducts = rawPromo?.products || [];
  const promoServices = rawPromo?.services || [];
  const campaignActive = rawPromo?.campaignActive ?? false;

  const isToggleOn = form.show_promo === "true";

  // Hitung status kampanye berdasarkan form saat ini (preview logika)
  const now = new Date();
  const startsAt = form.promo_starts_at ? new Date(form.promo_starts_at) : null;
  const endsAt = form.promo_ends_at ? new Date(form.promo_ends_at) : null;
  let campaignStatusLabel = "";
  let campaignStatusColor = "";

  if (!isToggleOn) {
    campaignStatusLabel = "Promo dinonaktifkan";
    campaignStatusColor = "text-slate-500 bg-slate-100";
  } else if (!startsAt && !endsAt) {
    campaignStatusLabel = "Aktif terus (mode manual)";
    campaignStatusColor = "text-green-700 bg-green-100";
  } else if (startsAt && now < startsAt) {
    campaignStatusLabel = `Belum dimulai — mulai ${form.promo_starts_at}`;
    campaignStatusColor = "text-yellow-700 bg-yellow-100";
  } else if (endsAt && now > endsAt) {
    campaignStatusLabel = `Sudah berakhir — berakhir ${form.promo_ends_at}`;
    campaignStatusColor = "text-red-700 bg-red-100";
  } else {
    campaignStatusLabel = "Sedang aktif";
    campaignStatusColor = "text-green-700 bg-green-100";
  }

  if (isSettingsLoading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Promo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola kampanye diskon — judul, banner, dan jadwal aktif promo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card: Kampanye */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">Kampanye Promo</h2>
            </div>
            {/* Status badge */}
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${campaignStatusColor}`}
            >
              {campaignStatusLabel}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Toggle aktif/nonaktif */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  Aktifkan Promo
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Jika aktif tanpa tanggal, promo berlaku terus hingga dimatikan
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleChange("show_promo", isToggleOn ? "false" : "true")
                }
                className="shrink-0"
              >
                {isToggleOn ? (
                  <ToggleRight size={36} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={36} className="text-gray-400" />
                )}
              </button>
            </div>

            {/* Judul kampanye */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Judul Kampanye
              </label>
              <input
                type="text"
                value={form.promo_title}
                onChange={(e) => handleChange("promo_title", e.target.value)}
                placeholder="cth: Promo Hari Kemerdekaan 🎉"
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.promo_title.length}/100 karakter
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Deskripsi Singkat
              </label>
              <textarea
                value={form.promo_description}
                onChange={(e) =>
                  handleChange("promo_description", e.target.value)
                }
                placeholder="cth: Dapatkan diskon spesial hingga 30% dalam rangka HUT RI ke-79"
                maxLength={300}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.promo_description.length}/300 karakter
              </p>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar size={13} className="inline mr-1.5 text-gray-400" />
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={form.promo_starts_at}
                  onChange={(e) =>
                    handleChange("promo_starts_at", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar size={13} className="inline mr-1.5 text-gray-400" />
                  Tanggal Berakhir
                </label>
                <input
                  type="date"
                  value={form.promo_ends_at}
                  onChange={(e) =>
                    handleChange("promo_ends_at", e.target.value)
                  }
                  min={form.promo_starts_at || undefined}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Info tanggal kosong */}
            {isToggleOn && !form.promo_starts_at && !form.promo_ends_at && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-xs">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                  Tanpa tanggal, promo akan aktif terus selama toggle di atas
                  dinyalakan.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card: Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Upload size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-800">Banner Promo</h2>
            <span className="text-xs text-gray-400 ml-1">(opsional)</span>
          </div>

          <div className="p-6">
            {bannerPreview ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={bannerPreview}
                    alt="Banner promo"
                    className="w-full object-cover"
                    style={{
                      maxHeight: "200px",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                  {bannerFile && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                      Belum disimpan
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-4 py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Upload size={14} />
                    Ganti Banner
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    disabled={isRemovingBanner}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2 border border-red-100 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {isRemovingBanner ? "Menghapus..." : "Hapus Banner"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                  <ImageOff
                    size={22}
                    className="text-gray-400 group-hover:text-blue-500 transition-colors"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
                    Upload Gambar Banner
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG, WebP — landscape direkomendasikan
                  </p>
                </div>
              </button>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Tombol simpan */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || (!isDirty && !bannerFile)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pengaturan"
            )}
          </button>
        </div>
      </form>

      {/* Card: Preview produk & service yang promo */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Item dalam Kampanye</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Produk dan layanan yang memiliki is_promo aktif. Edit dari halaman
            masing-masing.
          </p>
        </div>

        {isPromoLoading ? (
          <div className="p-6">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Peringatan jika kampanye tidak aktif — data tidak tampil dari getActivePromos */}
            {!campaignActive && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-xl text-yellow-700 text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Kampanye sedang tidak aktif. Data di bawah adalah item yang
                  akan tampil saat kampanye diaktifkan. Aktifkan promo di atas
                  untuk melihat data terkini.
                </p>
              </div>
            )}

            {/* Produk promo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package size={14} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">
                  Produk Promo
                </p>
                {promoProducts.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    {promoProducts.length}
                  </span>
                )}
              </div>

              {promoProducts.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Belum ada produk dengan promo aktif.{" "}
                  <a
                    href="/admin/products"
                    className="text-blue-600 hover:underline not-italic"
                  >
                    Kelola produk →
                  </a>
                </p>
              ) : (
                <div className="space-y-2">
                  {promoProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl"
                    >
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-red-100 rounded-lg shrink-0 flex items-center justify-center">
                          <Package size={14} className="text-red-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {p.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-red-600 text-xs font-bold">
                            Rp {Number(p.promo_price).toLocaleString("id-ID")}
                          </span>
                          <span className="line-through text-gray-400 text-xs">
                            Rp {Number(p.price).toLocaleString("id-ID")}
                          </span>
                          <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                            -{p.discount_percent}%
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/admin/products"
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        Edit →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service promo */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={14} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-700">
                  Layanan Promo
                </p>
                {promoServices.length > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                    {promoServices.length}
                  </span>
                )}
              </div>

              {promoServices.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Belum ada layanan dengan promo aktif.{" "}
                  <Link
                    to="/admin/services"
                    className="text-blue-600 hover:underline not-italic"
                  >
                    Kelola layanan →
                  </Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {promoServices.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl"
                    >
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.name}
                          className="w-10 h-10 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-orange-100 rounded-lg shrink-0 flex items-center justify-center">
                          <Briefcase size={14} className="text-orange-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {s.name}
                        </p>
                        <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full mt-0.5 font-semibold">
                          🔥 Sedang Promo
                        </span>
                      </div>
                      <Link
                        to="/admin/services"
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        Edit →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
