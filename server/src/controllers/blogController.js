import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";
import slugify from "slugify";
import sanitizeHtml from "sanitize-html";

const isDev = process.env.NODE_ENV !== "production";
const internalError = (err, res) => {
  console.error(err);
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error",
  });
};

const sanitizeBlogContent = (dirty) =>
  sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "div",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    // ✅ Paksa rel noopener pada semua link eksternal
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          target: attribs.target || "_blank",
        },
      }),
    },
  });

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
    return internalError(err, res);
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

    return res
      .status(201)
      .json({ success: true, message: "Category created successfully", data });
  } catch (err) {
    return internalError(err, res);
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: cat } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", id)
      .single();

    if (!cat) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // ✅ Hapus semua blog yang ada di kategori ini dulu
    const { error: blogsError } = await supabase
      .from("blogs")
      .delete()
      .eq("category_id", id);

    if (blogsError) throw blogsError;

    // ✅ Baru hapus kategorinya
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Category and all its blogs have been deleted.",
    });
  } catch (err) {
    return internalError(err, res);
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
    return internalError(err, res);
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

    return res
      .status(201)
      .json({ success: true, message: "Tag created successfully", data });
  } catch (err) {
    return internalError(err, res);
  }
};

export const deleteTag = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: tag } = await supabase
      .from("tags")
      .select("id")
      .eq("id", id)
      .single();

    if (!tag) {
      return res.status(404).json({ success: false, message: "Tag not found" });
    }

    // ✅ Hapus semua relasi blog_tags dulu, baru hapus tag
    const { error: relationError } = await supabase
      .from("blog_tags")
      .delete()
      .eq("tag_id", id);

    if (relationError) throw relationError;

    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;

    return res
      .status(200)
      .json({ success: true, message: "Tag deleted successfully." });
  } catch (err) {
    return internalError(err, res);
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

    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!status) {
      query = query.eq("status", "published");
    }

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
    return internalError(err, res);
  }
};

export const getBlogById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `*, categories ( id, name, slug ), blog_tags ( tags ( id, name, slug ) )`,
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return internalError(err, res);
  }
};

export const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `*, categories ( id, name, slug ), blog_tags ( tags ( id, name, slug ) )`,
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return internalError(err, res);
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

  // ✅ Category sekarang wajib
  if (!category_id) {
    return res.status(400).json({
      success: false,
      message: "Category is required",
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
      content: sanitizeBlogContent(content),
      cover_image_url,
      category_id,
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

    // ✅ Insert tags hanya kalau ada
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
        // ✅ Jangan leak tagError.message ke response
        throw new Error("Failed to save tags");
      }
    }

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (err) {
    return internalError(err, res);
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
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    let cover_image_url = existing.cover_image_url;
    if (req.file) {
      cover_image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "blogs",
      );
    }

    const wasPublished = existing.status === "published";
    const willPublish = status === "published";

    // ✅ Kalau category_id dikirim kosong string → tolak
    let finalCategoryId = existing.category_id;
    if (category_id !== undefined) {
      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }
      finalCategoryId = category_id;
    }

    const updatePayload = {
      ...(title && {
        title,
        slug: slugify(title, { lower: true, strict: true }),
      }),
      ...(content && { content: sanitizeBlogContent(content) }),
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
    return internalError(err, res);
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
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) throw error;

    return res
      .status(200)
      .json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    return internalError(err, res);
  }
};