import bcrypt from "bcryptjs";
import supabase from "../config/supabase.js";

export const getAllAdmins = async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, name, email, role, created_at");

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
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

  try {
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newAdmin, error } = await supabase
      .from("admins")
      .insert([
        {
          name,
          email,
          password_hash: hashedPassword,
          role,
        },
      ])
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: newAdmin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

export const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    // If they are trying to edit a superadmin's role to something else, maybe check if it's the last superadmin?
    // We'll trust the validation, but the spec says "Superadmin tidak bisa mengubah role dirinya sendiri"
    if (req.admin.id === id && role && role !== req.admin.role) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const updates = { name, email };
    if (role) updates.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(password, salt);
    }

    const { data: updatedAdmin, error } = await supabase
      .from("admins")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};

export const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.admin.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    const { data: targetAdmin, error: fetchError } = await supabase
      .from("admins")
      .select("role")
      .eq("id", id)
      .single();

    if (fetchError || !targetAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Spec says: "tidak bisa hapus superadmin lain"
    if (targetAdmin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: "You cannot delete another superadmin",
      });
    }

    const { error } = await supabase.from("admins").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
};
