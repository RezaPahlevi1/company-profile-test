import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";
import slugify from "slugify";

// Helper: ambil ID kategori/tag "General"
const getGeneralCategoryId = async () => {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "general")
    .single();
  return data?.id || null;
};

const getGeneralTagId = async () => {
  const { data } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", "general")
    .single();
  return data?.id || null;
};

// ==================== CATEGORIES ====================

export const getAllCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  }

  const slug = slugify(name, { lower: true, strict: true });

  try {
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, slug }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists",
        });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== TAGS ====================

export const getAllTags = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createTag = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  }

  const slug = slugify(name, { lower: true, strict: true });

  try {
    const { data, error } = await supabase
      .from("tags")
      .insert([{ name, slug }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Tag with this name already exists",
        });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== BLOGS ====================

export const getAllBlogs = async (req, res) => {
  const { category, tag, status } = req.query;

  try {
    let query = supabase
      .from("blogs")
      .select(
        `
        id, title, slug, cover_image_url, status, published_at, created_at,
        categories ( id, name, slug ),
        blog_tags ( tags ( id, name, slug ) )
      `,
      )
      .order("created_at", { ascending: false });

    // 'all' berarti admin minta semua status
    // kalau tidak ada status param, default hanya published
    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!status) {
      query = query.eq("status", "published");
    }
    // kalau status === 'all', tidak filter apapun

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data;

    if (category) {
      filtered = filtered.filter((blog) => blog.categories?.slug === category);
    }

    if (tag) {
      filtered = filtered.filter((blog) =>
        blog.blog_tags.some((bt) => bt.tags?.slug === tag),
      );
    }

    return res.status(200).json({ success: true, data: filtered });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getBlogById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        *,
        categories ( id, name, slug ),
        blog_tags ( tags ( id, name, slug ) )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        *,
        categories ( id, name, slug ),
        blog_tags ( tags ( id, name, slug ) )
      `,
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createBlog = async (req, res) => {
  const { title, content, category_id, tags, status } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: "Title and content are required",
    });
  }

  const blogStatus = status === "published" ? "published" : "draft";

  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = JSON.parse(tags);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Tags must be a valid JSON array",
      });
    }
  }

  // Kalau tidak ada tags → pakai General
  if (parsedTags.length === 0) {
    const generalTagId = await getGeneralTagId();
    if (generalTagId) parsedTags = [generalTagId];
  }

  // Kalau tidak ada category → pakai General
  const finalCategoryId = category_id || (await getGeneralCategoryId());

  const slug = slugify(title, { lower: true, strict: true });

  try {
    let cover_image_url = null;
    if (req.file) {
      cover_image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "blogs",
      );
    }

    const blogPayload = {
      admin_id: req.admin.id,
      title,
      slug,
      content,
      cover_image_url,
      category_id: finalCategoryId,
      status: blogStatus,
      published_at:
        blogStatus === "published" ? new Date().toISOString() : null,
    };

    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .insert([blogPayload])
      .select()
      .single();

    if (blogError) {
      if (blogError.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A blog with this title already exists",
        });
      }
      throw blogError;
    }

    if (parsedTags.length > 0) {
      const tagRows = parsedTags.map((tag_id) => ({
        blog_id: blog.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from("blog_tags")
        .insert(tagRows);

      if (tagError) {
        await supabase.from("blogs").delete().eq("id", blog.id);
        throw new Error(`Failed to save tags: ${tagError.message}`);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, content, category_id, tags, status } = req.body;

  try {
    const { data: existing, error: findError } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    let cover_image_url = existing.cover_image_url;
    if (req.file) {
      cover_image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "blogs",
      );
    }

    // Di dalam updateBlog, bagian update payload
    const wasPublished = existing.status === "published";
    const willPublish = status === "published";

    // Kalau category_id dikirim kosong string → fallback ke General
    let finalCategoryId = existing.category_id;
    if (category_id !== undefined) {
      finalCategoryId = category_id || (await getGeneralCategoryId());
    }

    const updatePayload = {
      ...(title && {
        title,
        slug: slugify(title, { lower: true, strict: true }),
      }),
      ...(content && { content }),
      category_id: finalCategoryId,
      ...(status && { status }),
      cover_image_url,
      published_at:
        willPublish && !wasPublished
          ? new Date().toISOString()
          : existing.published_at,
    };

    const { data: blog, error: blogError } = await supabase
      .from("blogs")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (blogError) throw blogError;

    if (tags !== undefined) {
      let parsedTags = [];
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Tags must be a valid JSON array",
        });
      }

      await supabase.from("blog_tags").delete().eq("blog_id", id);

      if (parsedTags.length > 0) {
        const tagRows = parsedTags.map((tag_id) => ({ blog_id: id, tag_id }));
        const { error: tagError } = await supabase
          .from("blog_tags")
          .insert(tagRows);

        if (tagError) throw tagError;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBlog = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing, error: findError } = await supabase
      .from("blogs")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const { error } = await supabase.from("blogs").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    // Cek apakah ini General — tidak boleh dihapus
    const { data: cat } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", id)
      .single();

    if (cat?.slug === "general") {
      return res.status(400).json({
        success: false,
        message: 'Default category "General" cannot be deleted',
      });
    }

    // Blog yang pakai kategori ini akan di-set ke General
    const generalId = await getGeneralCategoryId();
    if (generalId) {
      await supabase
        .from("blogs")
        .update({ category_id: generalId })
        .eq("category_id", id);
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Category deleted. Affected blogs moved to General.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTag = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: tag } = await supabase
      .from("tags")
      .select("slug")
      .eq("id", id)
      .single();

    if (tag?.slug === "general") {
      return res.status(400).json({
        success: false,
        message: 'Default tag "General" cannot be deleted',
      });
    }

    // blog_tags dengan tag ini akan di-set ke General
    const generalTagId = await getGeneralTagId();
    if (generalTagId) {
      await supabase
        .from("blog_tags")
        .update({ tag_id: generalTagId })
        .eq("tag_id", id);
    }

    const { error } = await supabase.from("tags").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Tag deleted. Affected blogs moved to General.",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
