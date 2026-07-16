import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
};

export const getAllServices = async (req, res) => {
  const { all } = req.query;

  try {
    let query = supabase
      .from("services")
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

export const getServiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createService = async (req, res) => {
  const { name, description, is_promo, price, discount_percent, is_orderable } =
    req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name is required" });
  }

  const resolvedIsOrderable = parseBoolean(is_orderable);
  const parsedPrice =
    price !== undefined && price !== "" ? parseFloat(price) : null;

  if (
    resolvedIsOrderable &&
    (parsedPrice == null || isNaN(parsedPrice) || parsedPrice <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Harga wajib diisi dan lebih dari 0 untuk layanan yang bisa dipesan online",
    });
  }

  try {
    let image_url = null;
    if (req.file) {
      image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "services",
      );
    }

    const { data, error } = await supabase
      .from("services")
      .insert([
        {
          name,
          description: description || null,
          image_url,
          is_active: true,
          is_promo: parseBoolean(is_promo),
          price: parsedPrice,
          discount_percent: parseFloat(discount_percent) || 0,
          is_orderable: resolvedIsOrderable,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res
      .status(201)
      .json({ success: true, message: "Service created successfully", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateService = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    is_active,
    is_promo,
    price,
    discount_percent,
    is_orderable,
  } = req.body;

  try {
    const { data: existing, error: findError } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const resolvedIsOrderable =
      is_orderable !== undefined
        ? parseBoolean(is_orderable)
        : existing.is_orderable;
    const resolvedPrice =
      price !== undefined
        ? price === ""
          ? null
          : parseFloat(price)
        : existing.price;

    if (
      resolvedIsOrderable &&
      (resolvedPrice == null || isNaN(resolvedPrice) || resolvedPrice <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Harga wajib diisi dan lebih dari 0 untuk layanan yang bisa dipesan online",
      });
    }

    let image_url = existing.image_url;
    if (req.file) {
      image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "services",
      );
    }

    const updatePayload = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(is_active !== undefined && { is_active: parseBoolean(is_active) }),
      ...(is_promo !== undefined && { is_promo: parseBoolean(is_promo) }),
      ...(price !== undefined && { price: resolvedPrice }),
      ...(discount_percent !== undefined && {
        discount_percent: parseFloat(discount_percent) || 0,
      }),
      ...(is_orderable !== undefined && { is_orderable: resolvedIsOrderable }),
      image_url,
    };

    const { data, error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Service updated successfully", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing, error: findError } = await supabase
      .from("services")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
