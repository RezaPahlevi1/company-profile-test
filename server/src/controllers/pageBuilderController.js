import supabase from "../config/supabase.js";
import sanitizeHtml from "sanitize-html";
import uploadToSupabase from "../utils/uploadToSupabase.js";

// ✅ Konfigurasi sanitize-html — tag dan atribut yang diizinkan
const SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "blockquote",
    "hr",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading", "decoding"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === "_blank" && { rel: "noopener noreferrer" }),
      },
    }),
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
    a: ["http", "https", "mailto"],
  },
};

function sanitizeField(html) {
  if (typeof html !== "string") return html;
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

function sanitizeBlockContent(type, content) {
  if (!content || typeof content !== "object") return content;
  const sanitized = { ...content };
  switch (type) {
    case "rich_text":
      if (sanitized.html) sanitized.html = sanitizeField(sanitized.html);
      break;
    case "image_text":
      if (sanitized.body) sanitized.body = sanitizeField(sanitized.body);
      break;
    default:
      break;
  }
  return sanitized;
}

function validateContentBounds(type, content) {
  if (!content || typeof content !== "object") return null;

  const LIMITS = {
    heading: 200,
    title: 200,
    subtitle: 500,
    label: 100,
    badge_text: 150,
    subheading: 500,
    body: 50000,
    html: 50000,
    body_1: 2000,
    body_2: 2000,
    cta_primary_label: 80,
    cta_secondary_label: 80,
    cta_primary_url: 500,
    cta_secondary_url: 500,
    cta_label: 80,
    cta_url: 500,
  };

  for (const [field, maxLen] of Object.entries(LIMITS)) {
    if (content[field] && typeof content[field] === "string") {
      if (content[field].length > maxLen) {
        return `Field "${field}" pada block "${type}" terlalu panjang (maksimal ${maxLen} karakter)`;
      }
    }
  }

  // ✅ Validasi bg_images — khusus hero block
  if (type === "hero" && content.bg_images !== undefined) {
    if (!Array.isArray(content.bg_images)) {
      return `Field "bg_images" pada block "hero" harus berupa array`;
    }
    if (content.bg_images.length > 10) {
      return `Maksimal 10 gambar untuk hero slider`;
    }
  }

  return null;
}

const ALLOWED_BLOCKS = {
  home: [
    "hero",
    "stats",
    "about_snippet",
    "cta",
    "rich_text",
    "image_text",
    "icon_grid",
    "products_preview",
    "services_preview",
    "blog_preview",
  ],
  about: [
    "hero",
    "story",
    "timeline",
    "team_grid",
    "cta",
    "rich_text",
    "image_text",
    "icon_grid",
    "products_preview",
    "services_preview",
    "blog_preview",
  ],
};

const VALID_PAGES = Object.keys(ALLOWED_BLOCKS);
const MAX_BLOCKS = 30;

// ✅ Helper: ekstrak path dari public URL Supabase Storage
// URL format: https://<project>.supabase.co/storage/v1/object/public/images/<path>
function extractStoragePath(publicUrl) {
  try {
    const marker = "/object/public/images/";
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return publicUrl.slice(idx + marker.length);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// GET /api/page-builder/:pageKey
// ─────────────────────────────────────────────
export const getPageConfig = async (req, res) => {
  const { pageKey } = req.params;

  if (!VALID_PAGES.includes(pageKey)) {
    return res.status(404).json({ success: false, message: "Page not found" });
  }

  try {
    const { data, error } = await supabase
      .from("page_configs")
      .select("page_key, blocks, updated_at")
      .eq("page_key", pageKey)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Page config not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/page-builder/:pageKey
// ─────────────────────────────────────────────
export const updatePageConfig = async (req, res) => {
  const { pageKey } = req.params;
  const { blocks } = req.body;

  if (!VALID_PAGES.includes(pageKey)) {
    return res.status(404).json({ success: false, message: "Page not found" });
  }

  if (!Array.isArray(blocks)) {
    return res
      .status(400)
      .json({ success: false, message: "blocks must be an array" });
  }

  if (blocks.length > MAX_BLOCKS) {
    return res.status(400).json({
      success: false,
      message: `Maksimal ${MAX_BLOCKS} block per halaman`,
    });
  }

  const allowedTypes = ALLOWED_BLOCKS[pageKey];

  for (const block of blocks) {
    if (!block.id || typeof block.id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Setiap block harus memiliki id yang valid",
      });
    }
    if (!allowedTypes.includes(block.type)) {
      return res.status(400).json({
        success: false,
        message: `Block type "${block.type}" tidak diizinkan untuk halaman "${pageKey}"`,
      });
    }
    if (typeof block.visible !== "boolean") {
      return res.status(400).json({
        success: false,
        message: `Block "${block.id}" harus memiliki field visible bertipe boolean`,
      });
    }

    const boundsError = validateContentBounds(block.type, block.content);
    if (boundsError) {
      return res.status(400).json({ success: false, message: boundsError });
    }
  }

  const normalizedBlocks = blocks.map((block, i) => ({
    ...block,
    order: i + 1,
    content: sanitizeBlockContent(block.type, block.content),
  }));

  try {
    const { data, error } = await supabase
      .from("page_configs")
      .update({
        blocks: normalizedBlocks,
        updated_at: new Date().toISOString(),
        updated_by: req.admin.id,
      })
      .eq("page_key", pageKey)
      .select("page_key, blocks, updated_at")
      .single();

    if (error) throw error;

    return res
      .status(200)
      .json({ success: true, message: "Page config updated", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/page-builder/upload-image
// Upload satu gambar hero ke Supabase Storage
// ─────────────────────────────────────────────
export const uploadHeroImage = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Tidak ada file yang diupload" });
  }

  try {
    const imageUrl = await uploadToSupabase(
      req.file.buffer,
      req.file.mimetype,
      "hero",
    );

    return res.status(201).json({
      success: true,
      message: "Gambar berhasil diupload",
      url: imageUrl,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/page-builder/delete-image
// Hapus satu gambar hero dari Supabase Storage
// Body: { url: "https://..." }
// ─────────────────────────────────────────────
export const deleteHeroImage = async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "URL gambar tidak valid" });
  }

  const storagePath = extractStoragePath(url);

  if (!storagePath) {
    return res.status(400).json({
      success: false,
      message: "URL bukan dari Supabase Storage project ini",
    });
  }

  // ✅ Pastikan hanya file di folder hero yang bisa dihapus lewat endpoint ini
  if (!storagePath.startsWith("hero/")) {
    return res.status(403).json({
      success: false,
      message:
        "Hanya gambar di folder hero yang bisa dihapus lewat endpoint ini",
    });
  }

  try {
    const { error } = await supabase.storage
      .from("images")
      .remove([storagePath]);

    if (error) throw error;

    return res
      .status(200)
      .json({ success: true, message: "Gambar berhasil dihapus" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
