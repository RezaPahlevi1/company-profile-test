import supabase from "../config/supabase.js";
import sanitizeRichText from "../utils/sanitizeRichText.js";

const isDev = process.env.NODE_ENV !== "production";
const internalError = (err, res) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
  });
};

// Whitelist eksplisit — cegah insert/query page_key sembarangan dari luar
const VALID_PAGE_KEYS = ["terms_and_conditions"];

export const getLegalPage = async (req, res) => {
  const { key } = req.params;

  if (!VALID_PAGE_KEYS.includes(key)) {
    return res
      .status(404)
      .json({ success: false, message: "Legal page not found" });
  }

  try {
    const { data, error } = await supabase
      .from("legal_pages")
      .select("page_key, title, content, updated_at")
      .eq("page_key", key)
      .single();

    if (error || !data) {
      // Belum ada konten — kembalikan struktur kosong (bukan error),
      // konsisten dengan pola "Halaman sedang dikonfigurasi" di Home/About
      return res.status(200).json({
        success: true,
        data: { page_key: key, title: "", content: "", updated_at: null },
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return internalError(err, res);
  }
};

export const updateLegalPage = async (req, res) => {
  const { key } = req.params;
  const { title, content } = req.body;

  if (!VALID_PAGE_KEYS.includes(key)) {
    return res
      .status(404)
      .json({ success: false, message: "Legal page not found" });
  }

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  try {
    const payload = {
      page_key: key,
      title,
      content: sanitizeRichText(content),
      updated_by: req.admin.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("legal_pages")
      .upsert(payload, { onConflict: "page_key" })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Legal page updated successfully",
      data,
    });
  } catch (err) {
    return internalError(err, res);
  }
};
