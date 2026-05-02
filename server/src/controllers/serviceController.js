import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

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
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is required",
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
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateService = async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;

  try {
    const { data: existing, error: findError } = await supabase
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
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
      ...(is_active !== undefined && {
        is_active: is_active === "true" || is_active === true,
      }),
      image_url,
    };

    const { data, error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
