import supabase from "../config/supabase.js";

// Block types yang diizinkan per page
const ALLOWED_BLOCKS = {
  home: [
    "hero", "stats", "about_snippet", "cta",
    "rich_text", "image_text", "icon_grid",
    "products_preview", "services_preview", "blog_preview",
  ],
  about: [
    "hero", "story", "timeline", "team_grid", "cta",
    "rich_text", "image_text", "icon_grid",
    "products_preview", "services_preview", "blog_preview",
  ],
};

const VALID_PAGES = Object.keys(ALLOWED_BLOCKS);

export const getPageConfig = async (req, res) => {
  const { pageKey } = req.params;

  if (!VALID_PAGES.includes(pageKey)) {
    return res.status(404).json({
      success: false,
      message: "Page not found",
    });
  }

  try {
    const { data, error } = await supabase
      .from("page_configs")
      .select("page_key, blocks, updated_at")
      .eq("page_key", pageKey)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Page config not found",
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePageConfig = async (req, res) => {
  const { pageKey } = req.params;
  const { blocks } = req.body;

  if (!VALID_PAGES.includes(pageKey)) {
    return res.status(404).json({
      success: false,
      message: "Page not found",
    });
  }

  if (!Array.isArray(blocks)) {
    return res.status(400).json({
      success: false,
      message: "blocks must be an array",
    });
  }

  // ✅ Validasi setiap block
  const allowedTypes = ALLOWED_BLOCKS[pageKey];
  for (const block of blocks) {
    if (!block.id || typeof block.id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Each block must have a valid id",
      });
    }
    if (!allowedTypes.includes(block.type)) {
      return res.status(400).json({
        success: false,
        message: `Block type "${block.type}" is not allowed for page "${pageKey}"`,
      });
    }
    if (typeof block.visible !== "boolean") {
      return res.status(400).json({
        success: false,
        message: `Block "${block.id}" must have a boolean visible field`,
      });
    }
  }

  // ✅ Pastikan order unik dan sequential
  const orders = blocks.map((b, i) => i + 1);
  const normalizedBlocks = blocks.map((block, i) => ({
    ...block,
    order: i + 1,
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

    return res.status(200).json({
      success: true,
      message: "Page config updated",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};