import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
};

export const getAllBrands = async (req, res) => {
  const { all } = req.query;

  try {
    let query = supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: true }); // urutan input, tampil kiri ke kanan

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

export const createBrand = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Brand logo image is required",
    });
  }

  try {
    const image_url = await uploadToSupabase(
      req.file.buffer,
      req.file.mimetype,
      "brands",
    );

    const { data, error } = await supabase
      .from("brands")
      .insert([{ name, image_url, is_active: true }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBrand = async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  try {
    const { data: existing, error: findError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    let image_url = existing.image_url;

    if (req.file) {
      image_url = await uploadToSupabase(
        req.file.buffer,
        req.file.mimetype,
        "brands",
      );
    }

    const updatePayload = {
      ...(name && { name }),
      ...(is_active !== undefined && { is_active: parseBoolean(is_active) }),
      image_url,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("brands")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBrand = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing, error: findError } = await supabase
      .from("brands")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
