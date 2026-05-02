import supabase from "../config/supabase.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

// export const getAllProducts = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("products")
//       .select("*")
//       .eq("is_active", true)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     return res.status(200).json({
//       success: true,
//       data,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export const getAllProducts = async (req, res) => {
  const { all } = req.query;

  try {
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    // Kalau tidak ada query param ?all=true, hanya tampilkan yang aktif
    // Ini dipakai oleh halaman publik
    // Admin bisa akses semua dengan ?all=true
    // if (!all) {
    //   query = query.eq("is_active", true);
    // }

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

export const createProduct = async (req, res) => {
  const { name, description, price, allow_negotiation } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      success: false,
      message: "Name and price are required",
    });
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
          allow_negotiation:
            allow_negotiation === "true" || allow_negotiation === true,
          is_active: true,
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
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, allow_negotiation, is_active } = req.body;

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
        allow_negotiation:
          allow_negotiation === "true" || allow_negotiation === true,
      }),
      ...(is_active !== undefined && {
        is_active: is_active === "true" || is_active === true,
      }),
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
    return res.status(500).json({
      success: false,
      message: err.message,
    });
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
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
