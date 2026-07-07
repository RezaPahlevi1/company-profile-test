import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login first.",
    });
  }

  let decoded;
  try {
    // ✅ Whitelist algoritma eksplisit — mencegah alg-confusion attack
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }

  try {
    // ✅ Hybrid check: admin masih ada? role live dari DB? token belum di-revoke?
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, name, email, role, token_valid_after")
      .eq("id", decoded.id)
      .single();

    if (error || !admin) {
      // Admin sudah dihapus, atau row tidak ditemukan lagi
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }

    const tokenIssuedAtMs = decoded.iat * 1000;
    const validAfterMs = admin.token_valid_after
      ? new Date(admin.token_valid_after).getTime()
      : 0;

    if (tokenIssuedAtMs < validAfterMs) {
      // Token diterbitkan sebelum password diganti / sesi di-revoke
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    // ✅ role SELALU dari DB live, bukan dari payload token lama
    req.admin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (err) {
    // Kegagalan infrastruktur (DB down, dll) → 500, BUKAN 401
    // Ini penting: useAuthVerify di frontend cuma clear session pada 401,
    // bukan 500 — jadi outage sementara tidak memaksa semua admin logout.
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authMiddleware;
