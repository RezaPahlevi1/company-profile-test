import supabase from "../config/supabase.js";

// ==================== HELPER ====================

// Evaluasi apakah kampanye promo sedang aktif berdasarkan settings
// Logic:
//   show_promo = "false" → tidak aktif apapun kondisinya
//   show_promo = "true" + tidak ada tanggal → aktif terus (manual mode)
//   show_promo = "true" + ada tanggal → aktif hanya dalam rentang tanggal
const evaluateCampaignActive = (settings) => {
  if (settings.show_promo === "false") return false;

  const now = Date.now();
  const startsAt = settings.promo_starts_at
    ? new Date(settings.promo_starts_at).getTime()
    : null;
  const endsAt = settings.promo_ends_at
    ? new Date(settings.promo_ends_at).getTime()
    : null;

  // Tidak ada tanggal sama sekali → aktif terus selama toggle on
  if (!startsAt && !endsAt) return true;

  // Ada tanggal mulai tapi belum dimulai
  if (startsAt && now < startsAt) return false;

  // Ada tanggal berakhir dan sudah lewat
  if (endsAt && now > endsAt) return false;

  return true;
};

// ==================== CONTROLLER ====================

export const getActivePromos = async (req, res) => {
  try {
    const [
      { data: products, error: pErr },
      { data: services, error: sErr },
      { data: settingsRows, error: stErr },
    ] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, price, discount_percent, image_url")
        .eq("is_promo", true)
        .eq("is_active", true),
      supabase
        .from("services")
        .select("id, name, image_url")
        .eq("is_promo", true)
        .eq("is_active", true),
      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "show_promo",
          "promo_starts_at",
          "promo_ends_at",
          "promo_title",
          "promo_description",
          "promo_banner_url",
        ]),
    ]);

    if (pErr) throw pErr;
    if (sErr) throw sErr;
    if (stErr) throw stErr;

    // Ubah array settings ke object
    const settings = (settingsRows || []).reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const campaignActive = evaluateCampaignActive(settings);

    // Jika kampanye tidak aktif, return hasPromo false
    // tanpa expose data produk — badge tidak akan tampil
    if (!campaignActive) {
      return res.status(200).json({
        success: true,
        data: {
          hasPromo: false,
          campaignActive: false,
          campaign: null,
          products: [],
          services: [],
        },
      });
    }

    const hasPromo = products.length > 0 || services.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        hasPromo,
        campaignActive: true,
        // Info kampanye untuk ditampilkan di popup dan halaman publik
        campaign: {
          title: settings.promo_title || "",
          description: settings.promo_description || "",
          banner_url: settings.promo_banner_url || "",
        },
        products: products.map((p) => ({
          ...p,
          promo_price: Math.round(
            p.price - (p.price * p.discount_percent) / 100,
          ),
        })),
        services,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
