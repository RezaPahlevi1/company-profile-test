import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
};

// ✅ Sanitasi HANYA untuk email — password TIDAK BOLEH disanitasi
const sanitizeString = (str) =>
  typeof str === "string" ? str.trim().replace(/\s+/g, " ") : "";

// ✅ Dummy hash statis (bcrypt cost 10, sama dengan hash asli) — hanya
// dipakai untuk padding waktu respons saat admin tidak ditemukan.
// Ini BUKAN password siapa pun, murni untuk membuat bcrypt.compare()
// selalu dieksekusi dan waktu respons konsisten (anti timing attack).
const DUMMY_HASH =
  "$2b$10$/5gkCVfEif6U.b9cEE2Ef.klpdNrvAxD8/yVjV8jxqvVDVz7q02te";

export const login = async (req, res) => {
  let { email, password } = req.body;

  // ✅ Email tetap disanitasi (aman, email tidak butuh whitespace signifikan)
  email = sanitizeString(email).toLowerCase();
  // ✅ Password diperlakukan sebagai raw data — tidak di-trim, tidak diubah
  password = typeof password === "string" ? password : "";

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  if (email.length > 254 || password.length > 128) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  try {
    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    const adminExists = !error && !!admin;

    // ✅ bcrypt.compare() SELALU dijalankan, entah admin ada atau tidak —
    // menutup timing side-channel untuk user enumeration
    const isPasswordValid = await bcrypt.compare(
      password,
      adminExists ? admin.password_hash : DUMMY_HASH,
    );

    if (!adminExists || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const payload = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      algorithm: "HS256",
    });

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.admin,
  });
};
