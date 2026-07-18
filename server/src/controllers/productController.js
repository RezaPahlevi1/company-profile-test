import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

// Helper function
const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
};

export const getAllProducts = async (req, res) => {
  const { all } = req.query;

  try {
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!all) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req, res) => {
  const {
    name,
    description,
    price,
    allow_negotiation,
    discount_percent,
    is_promo,
    delivery_estimation,
  } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "Name and price are required",
    });
  }

  if (discount_percent !== undefined && discount_percent !== "") {
    const parsedDiscount = parseFloat(discount_percent);
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount percent harus berupa angka antara 0 dan 100",
      });
    }
  }

  try {
    let image_url = null;

    if (req.file) {
      image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "products",
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description: description || null,
          price: parseFloat(price),
          image_url,
          allow_negotiation: parseBoolean(allow_negotiation),
          is_active: true,
          discount_percent: parseFloat(discount_percent) || 0,
          is_promo: parseBoolean(is_promo),
          delivery_estimation: delivery_estimation || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    allow_negotiation,
    is_active,
    discount_percent,
    is_promo,
    delivery_estimation,
  } = req.body;

  if (discount_percent !== undefined && discount_percent !== "") {
    const parsedDiscount = parseFloat(discount_percent);
    if (isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount percent harus berupa angka antara 0 dan 100",
      });
    }
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let image_url = existing.image_url;

    if (req.file) {
      image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "products",
      );
    }

    const updatePayload = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(allow_negotiation !== undefined && {
        allow_negotiation: parseBoolean(allow_negotiation),
      }),
      ...(is_active !== undefined && { is_active: parseBoolean(is_active) }),
      ...(discount_percent !== undefined && {
        discount_percent: parseFloat(discount_percent) || 0,
      }),
      ...(is_promo !== undefined && { is_promo: parseBoolean(is_promo) }),
      ...(delivery_estimation !== undefined && { delivery_estimation }),
      image_url,
    };

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing, error: findError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
