import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

// ==================== HELPERS ====================

// Ekstrak YouTube video ID dari berbagai format URL
// Mengembalikan video ID string, atau null jika tidak valid
const extractYoutubeId = (input) => {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // Jika sudah berupa video ID murni (11 karakter alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  // Format: https://youtube.com/watch?v=VIDEO_ID&...
  const watchMatch = trimmed.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
  );
  if (watchMatch) return watchMatch[1];

  // Format: https://youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Format: https://www.youtube.com/embed/VIDEO_ID
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
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSiteSettings = async (req, res) => {
  const {
    site_name,
    site_description,
    payment_expiry_hours,
    delivery_estimation,
    show_site_name,
    whatsapp_number,
    show_whatsapp,
    footer_tagline,
    footer_cta_title,
    footer_cta_body,
    footer_video_url,
    show_footer_video,
  } = req.body;

  // Validasi payment_expiry_hours
  if (payment_expiry_hours !== undefined) {
    const hours = Number(payment_expiry_hours);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        message: "Payment expiry must be between 1 and 168 hours",
      });
    }
  }

  // Validasi whatsapp_number — strip non-angka, cek panjang 10-15 digit
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

  // Validasi show_whatsapp
  if (
    show_whatsapp !== undefined &&
    !["true", "false"].includes(show_whatsapp)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for show_whatsapp",
    });
  }

  // Validasi show_footer_video
  if (
    show_footer_video !== undefined &&
    !["true", "false"].includes(show_footer_video)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid value for show_footer_video",
    });
  }

  // Validasi dan ekstrak YouTube video ID
  // Simpan sebagai video ID murni, bukan full URL
  if (footer_video_url !== undefined) {
    if (footer_video_url === "") {
      // Boleh kosong — berarti hapus video
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

  try {
    const updates = [];

    if (site_name !== undefined)
      updates.push({ key: "site_name", value: site_name });
    if (site_description !== undefined)
      updates.push({ key: "site_description", value: site_description });
    if (payment_expiry_hours !== undefined)
      updates.push({
        key: "payment_expiry_hours",
        value: String(payment_expiry_hours),
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

    for (const update of updates) {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: update.value })
        .eq("key", update.key);

      if (error) throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided",
    });
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
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteLogo = async (req, res) => {
  try {
    const { error } = await supabase
      .from("site_settings")
      .update({ value: "" })
      .eq("key", "navbar_logo_url");

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Logo removed successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePageSetting = async (req, res) => {
  const { key } = req.params;
  const { title, navbar_label, is_active } = req.body;

  // Halaman yang tidak bisa dinonaktifkan
  const alwaysActivePages = ["home", "order-track"];
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
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
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
    return res.status(500).json({ success: false, message: err.message });
  }
};
