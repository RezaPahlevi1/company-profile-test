import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";
import {
  SESSION_DURATION_KEY,
  MIN_SESSION_HOURS,
  MAX_SESSION_HOURS,
} from "../config/sessionSettings.js";

const isDev = process.env.NODE_ENV !== "production";
const internalError = (err, res) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
  });
};

// ==================== HELPERS ====================

const extractYoutubeId = (input) => {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
  );
  if (watchMatch) return watchMatch[1];
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
};

// ==================== SITE SETTINGS ====================

export const getSiteSettings = async (req, res) => {
  try {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) throw error;
    const settings = data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    return internalError(err, res);
  }
};

export const updateSiteSettings = async (req, res) => {
  const {
    site_name,
    site_description,
    payment_expiry_minutes,
    delivery_estimation,
    show_site_name,
    whatsapp_number,
    show_whatsapp,
    footer_tagline,
    footer_cta_title,
    footer_cta_body,
    footer_video_url,
    show_footer_video,
    company_email,
    company_address,
    company_maps_embed_url,
    bank_account_info,
    manual_payment_verification_hours,
    manual_payment_expiry_minutes,
    terms_highlight,
    gateway_payment_enabled,
    admin_session_duration_hours,
  } = req.body;

  // Validasi payment_expiry_minutes — 1 menit sampai 1440 menit (24 jam)
  if (payment_expiry_minutes !== undefined) {
    const minutes = Number(payment_expiry_minutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({
        success: false,
        message:
          "Batas waktu pembayaran harus antara 1 hingga 1440 menit (24 jam)",
      });
    }
  }

  if (manual_payment_expiry_minutes !== undefined) {
    const minutes = Number(manual_payment_expiry_minutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({
        success: false,
        message:
          "Batas waktu pembayaran manual harus antara 1 hingga 1440 menit (24 jam)",
      });
    }
  }

  // ✅ Validasi admin_session_duration_hours — batas sama persis dengan
  // yang dipakai authController.js (via config/sessionSettings.js),
  // supaya tidak ada kemungkinan nilai lolos di sini tapi ditolak/di-fallback
  // diam-diam di authController.js, atau sebaliknya.
  if (admin_session_duration_hours !== undefined) {
    const hours = Number(admin_session_duration_hours);
    if (
      !Number.isInteger(hours) ||
      hours < MIN_SESSION_HOURS ||
      hours > MAX_SESSION_HOURS
    ) {
      return res.status(400).json({
        success: false,
        message: `Durasi sesi login admin harus antara ${MIN_SESSION_HOURS} hingga ${MAX_SESSION_HOURS} jam (${MAX_SESSION_HOURS / 24} hari)`,
      });
    }
  }

  // Validasi whatsapp_number
  if (whatsapp_number !== undefined) {
    const cleaned = String(whatsapp_number).replace(/\D/g, "");
    if (cleaned.length < 10 || cleaned.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp harus 10-15 digit angka",
      });
    }
    req.body.whatsapp_number = cleaned;
  }

  if (
    show_whatsapp !== undefined &&
    !["true", "false"].includes(show_whatsapp)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for show_whatsapp",
    });
  }

  if (
    gateway_payment_enabled !== undefined &&
    !["true", "false"].includes(gateway_payment_enabled)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for gateway_payment_enabled",
    });
  }

  if (
    show_footer_video !== undefined &&
    !["true", "false"].includes(show_footer_video)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for show_footer_video",
    });
  }

  if (footer_video_url !== undefined) {
    if (footer_video_url === "") {
      req.body.footer_video_id = "";
    } else {
      const videoId = extractYoutubeId(footer_video_url);
      if (!videoId) {
        return res.status(400).json({
          success: false,
          message:
            "URL YouTube tidak valid. Gunakan format: https://youtube.com/watch?v=... atau https://youtu.be/...",
        });
      }
      req.body.footer_video_id = videoId;
    }
  }

  // Validasi company_email
  if (company_email !== undefined && company_email !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(company_email)) {
      return res.status(400).json({
        success: false,
        message: "Format email perusahaan tidak valid",
      });
    }
  }

  // Validasi company_maps_embed_url — harus URL embed Google Maps atau kosong
  if (company_maps_embed_url !== undefined && company_maps_embed_url !== "") {
    const isValidMapsEmbed =
      company_maps_embed_url.startsWith("https://www.google.com/maps/embed") ||
      company_maps_embed_url.startsWith("https://maps.google.com/maps");
    if (!isValidMapsEmbed) {
      return res.status(400).json({
        success: false,
        message:
          "URL Maps tidak valid. Gunakan embed URL dari Google Maps (Share → Embed a map).",
      });
    }
    if (
      /javascript:/i.test(company_maps_embed_url) ||
      /data:/i.test(company_maps_embed_url)
    ) {
      return res.status(400).json({
        success: false,
        message: "URL Maps tidak valid.",
      });
    }
  }

  try {
    const updates = [];
    if (site_name !== undefined)
      updates.push({ key: "site_name", value: site_name });
    if (site_description !== undefined)
      updates.push({ key: "site_description", value: site_description });
    if (payment_expiry_minutes !== undefined)
      updates.push({
        key: "payment_expiry_minutes",
        value: String(payment_expiry_minutes),
      });
    if (manual_payment_expiry_minutes !== undefined)
      updates.push({
        key: "manual_payment_expiry_minutes",
        value: String(manual_payment_expiry_minutes),
      });
    if (delivery_estimation !== undefined)
      updates.push({ key: "delivery_estimation", value: delivery_estimation });
    if (show_site_name !== undefined)
      updates.push({ key: "show_site_name", value: show_site_name });
    if (whatsapp_number !== undefined)
      updates.push({ key: "whatsapp_number", value: req.body.whatsapp_number });
    if (show_whatsapp !== undefined)
      updates.push({ key: "show_whatsapp", value: show_whatsapp });
    if (footer_tagline !== undefined)
      updates.push({ key: "footer_tagline", value: footer_tagline });
    if (footer_cta_title !== undefined)
      updates.push({ key: "footer_cta_title", value: footer_cta_title });
    if (footer_cta_body !== undefined)
      updates.push({ key: "footer_cta_body", value: footer_cta_body });
    if (footer_video_url !== undefined)
      updates.push({ key: "footer_video_id", value: req.body.footer_video_id });
    if (show_footer_video !== undefined)
      updates.push({ key: "show_footer_video", value: show_footer_video });
    if (company_email !== undefined)
      updates.push({ key: "company_email", value: company_email });
    if (company_address !== undefined)
      updates.push({ key: "company_address", value: company_address });
    if (company_maps_embed_url !== undefined)
      updates.push({
        key: "company_maps_embed_url",
        value: company_maps_embed_url,
      });
    if (bank_account_info !== undefined)
      updates.push({ key: "bank_account_info", value: bank_account_info });
    if (manual_payment_verification_hours !== undefined)
      updates.push({
        key: "manual_payment_verification_hours",
        value: manual_payment_verification_hours,
      });
    if (terms_highlight !== undefined)
      updates.push({ key: "terms_highlight", value: terms_highlight });
    if (gateway_payment_enabled !== undefined) {
      updates.push({
        key: "gateway_payment_enabled",
        value: gateway_payment_enabled,
      });
      console.warn(
        `[AUDIT] gateway_payment_enabled -> "${gateway_payment_enabled}" by admin ${req.admin?.id} (${req.admin?.email}) at ${new Date().toISOString()}`,
      );
    }
    if (admin_session_duration_hours !== undefined) {
      updates.push({
        key: SESSION_DURATION_KEY,
        value: String(admin_session_duration_hours),
      });
      // ✅ Log audit — ini setting keamanan sensitif (mempengaruhi durasi
      // sesi SEMUA admin), sama pentingnya dengan gateway_payment_enabled
      console.warn(
        `[AUDIT] ${SESSION_DURATION_KEY} -> "${admin_session_duration_hours}" by admin ${req.admin?.id} (${req.admin?.email}) at ${new Date().toISOString()}`,
      );
    }

    for (const update of updates) {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: update.value })
        .eq("key", update.key);
      if (error) throw error;
    }

    return res
      .status(200)
      .json({ success: true, message: "Settings updated successfully" });
  } catch (err) {
    return internalError(err, res);
  }
};

export const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file provided" });
  }
  try {
    const logoUrl = await uploadToSupabase(
      req.file.buffer,
      req.file.mimetype,
      "settings",
    );
    const { error } = await supabase
      .from("site_settings")
      .update({ value: logoUrl })
      .eq("key", "navbar_logo_url");
    if (error) throw error;
    return res.status(200).json({
      success: true,
      message: "Logo uploaded successfully",
      data: { logo_url: logoUrl },
    });
  } catch (err) {
    return internalError(err, res);
  }
};

export const deleteLogo = async (req, res) => {
  try {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: "" })
      .eq("key", "navbar_logo_url");
    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Logo removed successfully" });
  } catch (err) {
    return internalError(err, res);
  }
};

// ==================== PROMO SETTINGS ====================

export const getPromoSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "show_promo",
        "promo_title",
        "promo_description",
        "promo_banner_url",
        "promo_starts_at",
        "promo_ends_at",
      ]);
    if (error) throw error;
    const settings = data.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
    return res.status(200).json({ success: true, data: settings });
  } catch (err) {
    return internalError(err, res);
  }
};

export const updatePromoSettings = async (req, res) => {
  const {
    show_promo,
    promo_title,
    promo_description,
    promo_starts_at,
    promo_ends_at,
  } = req.body;

  if (show_promo !== undefined && !["true", "false"].includes(show_promo)) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for show_promo",
    });
  }

  if (promo_starts_at && promo_ends_at) {
    const start = new Date(promo_starts_at);
    const end = new Date(promo_ends_at);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Format tanggal tidak valid",
      });
    }
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "Tanggal mulai harus sebelum tanggal berakhir",
      });
    }
  }

  if (promo_starts_at && !promo_ends_at) {
    if (isNaN(new Date(promo_starts_at).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Format tanggal mulai tidak valid",
      });
    }
  }
  if (promo_ends_at && !promo_starts_at) {
    if (isNaN(new Date(promo_ends_at).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Format tanggal berakhir tidak valid",
      });
    }
  }

  try {
    const updates = [];
    if (show_promo !== undefined)
      updates.push({ key: "show_promo", value: show_promo });
    if (promo_title !== undefined)
      updates.push({ key: "promo_title", value: promo_title });
    if (promo_description !== undefined)
      updates.push({ key: "promo_description", value: promo_description });
    if (promo_starts_at !== undefined)
      updates.push({
        key: "promo_starts_at",
        value: promo_starts_at ? new Date(promo_starts_at).toISOString() : "",
      });
    if (promo_ends_at !== undefined)
      updates.push({
        key: "promo_ends_at",
        value: promo_ends_at ? new Date(promo_ends_at).toISOString() : "",
      });

    for (const update of updates) {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: update.value })
        .eq("key", update.key);
      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Promo settings updated successfully",
    });
  } catch (err) {
    return internalError(err, res);
  }
};

export const uploadPromoBanner = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file provided" });
  }
  try {
    const bannerUrl = await uploadToSupabase(
      req.file.buffer,
      req.file.mimetype,
      "promo",
    );
    const { error } = await supabase
      .from("site_settings")
      .update({ value: bannerUrl })
      .eq("key", "promo_banner_url");
    if (error) throw error;
    return res.status(200).json({
      success: true,
      message: "Promo banner uploaded successfully",
      data: { banner_url: bannerUrl },
    });
  } catch (err) {
    return internalError(err, res);
  }
};

export const deletePromoBanner = async (req, res) => {
  try {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: "" })
      .eq("key", "promo_banner_url");
    if (error) throw error;
    return res.status(200).json({
      success: true,
      message: "Promo banner removed successfully",
    });
  } catch (err) {
    return internalError(err, res);
  }
};

// ==================== PAGE SETTINGS ====================

export const getPageSettings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("page_settings")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return internalError(err, res);
  }
};

export const updatePageSetting = async (req, res) => {
  const { key } = req.params;
  const { title, navbar_label, is_active } = req.body;

  const alwaysActivePages = ["home"];
  if (alwaysActivePages.includes(key) && is_active === false) {
    return res.status(400).json({
      success: false,
      message: `Page "${key}" cannot be deactivated`,
    });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from("page_settings")
      .select("*")
      .eq("page_key", key)
      .single();

    if (findError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    const updatePayload = {
      ...(title !== undefined && { title }),
      ...(navbar_label !== undefined && { navbar_label }),
      ...(is_active !== undefined && { is_active }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("page_settings")
      .update(updatePayload)
      .eq("page_key", key)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Page setting updated",
      data,
    });
  } catch (err) {
    return internalError(err, res);
  }
};
