import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";
import {
  SESSION_DURATION_KEY,
  MIN_SESSION_HOURS,
  MAX_SESSION_HOURS,
  DEFAULT_SESSION_HOURS,
} from "../config/sessionSettings.js";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// ✅ Sanitasi HANYA untuk email — password TIDAK BOLEH disanitasi
const sanitizeString = (str) =>
  typeof str === "string" ? str.trim().replace(/\s+/g, " ") : "";

// ✅ Dummy hash statis (bcrypt cost 10) — padding waktu respons, anti timing attack
const DUMMY_HASH =
  "$2b$10$/5gkCVfEif6U.b9cEE2Ef.klpdNrvAxD8/yVjV8jxqvVDVz7q02te";

const getSessionDurationHours = async () => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", SESSION_DURATION_KEY)
      .single();

    if (error || !data?.value) return DEFAULT_SESSION_HOURS;

    const hours = parseInt(data.value, 10);
    if (
      !Number.isInteger(hours) ||
      hours < MIN_SESSION_HOURS ||
      hours > MAX_SESSION_HOURS
    ) {
      return DEFAULT_SESSION_HOURS;
    }
    return hours;
  } catch {
    return DEFAULT_SESSION_HOURS;
  }
};

export const login = async (req, res) => {
  let { email, password } = req.body;

  email = sanitizeString(email).toLowerCase();
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

    const sessionHours = await getSessionDurationHours();
    const sessionMs = sessionHours * 60 * 60 * 1000;

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `${sessionHours}h`,
      algorithm: "HS256",
    });

    res.cookie("token", token, { ...baseCookieOptions, maxAge: sessionMs });

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
  res.clearCookie("token", baseCookieOptions);
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
