import supabase from "../config/supabase.js";

// ==================== HELPER ====================

const evaluateCampaignActive = (settings) => {
  if (settings.show_promo === "false") return false;

  const now = Date.now();
  const startsAt = settings.promo_starts_at
    ? new Date(settings.promo_starts_at).getTime()
    : null;
  const endsAt = settings.promo_ends_at
    ? new Date(settings.promo_ends_at).getTime()
    : null;

  if (!startsAt && !endsAt) return true;
  if (startsAt && now < startsAt) return false;
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
        .select("id, name, image_url, price, discount_percent, is_orderable")
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

    const settings = (settingsRows || []).reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    const campaignActive = evaluateCampaignActive(settings);

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

    // Sertakan starts_at dan ends_at di campaign
    // agar frontend bisa menampilkan range tanggal
    // Hanya sertakan jika KEDUANYA ada — jika salah satu kosong,
    // frontend akan menyembunyikan range tanggal
    const startsAt = settings.promo_starts_at || null;
    const endsAt = settings.promo_ends_at || null;

    return res.status(200).json({
      success: true,
      data: {
        hasPromo,
        campaignActive: true,
        campaign: {
          title: settings.promo_title || "",
          description: settings.promo_description || "",
          banner_url: settings.promo_banner_url || "",
          // Range tanggal — null jika tidak lengkap
          starts_at: startsAt && endsAt ? startsAt : null,
          ends_at: startsAt && endsAt ? endsAt : null,
        },
        products: products.map((p) => ({
          ...p,
          promo_price:
            p.discount_percent > 0
              ? Math.round(p.price - (p.price * p.discount_percent) / 100)
              : p.price,
        })),
        services: services.map((s) => ({
          ...s,
          promo_price:
            s.is_orderable && s.price != null && s.discount_percent > 0
              ? Math.round(s.price - (s.price * s.discount_percent) / 100)
              : null,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
