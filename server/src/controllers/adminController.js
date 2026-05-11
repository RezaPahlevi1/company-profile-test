import supabase from "../config/supabase.js";
import bcrypt from "bcryptjs";

export const getAllAdmins = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("admins")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createAdmin = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and role are required",
    });
  }

  // ✅ Hanya admin_konten dan admin_order yang bisa dibuat
  const allowedRoles = ["admin_konten", "admin_order"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be admin_konten or admin_order",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  try {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("admins")
      .insert([{ name, email, password_hash, role }])
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  const requesterId = req.admin.id;

  try {
    const { data: existing, error: findError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ✅ Tidak bisa upgrade role siapapun menjadi superadmin
    if (role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign superadmin role",
      });
    }

    // ✅ Tidak bisa ubah role diri sendiri
    if (id === requesterId && role && role !== existing.role) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    // ✅ Tidak bisa edit superadmin lain (nama, email, password sekalipun)
    if (existing.role === "superadmin" && id !== requesterId) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify another superadmin",
      });
    }

    const updatePayload = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
      updatePayload.password_hash = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("admins")
      .update(updatePayload)
      .eq("id", id)
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.admin.id;

  if (id === requesterId) {
    return res.status(400).json({
      success: false,
      message: "You cannot delete your own account",
    });
  }

  try {
    const { data: existing, error: findError } = await supabase
      .from("admins")
      .select("role")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (existing.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a superadmin account",
      });
    }

    const { error } = await supabase.from("admins").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
