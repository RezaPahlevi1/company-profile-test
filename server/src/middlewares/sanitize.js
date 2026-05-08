// ✅ Buat file baru: middlewares/sanitize.js

const sanitizeString = (val) => {
  if (typeof val !== "string") return val;
  return val.trim().replace(/\s+/g, " ");
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      result[key] = sanitizeString(val);
    } else if (typeof val === "object" && !Array.isArray(val)) {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
};

// ✅ Middleware — sanitasi semua string di req.body
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

// ✅ Bounds checker untuk field tertentu
export const checkBounds = (rules) => (req, res, next) => {
  for (const [field, { max, min = 0 }] of Object.entries(rules)) {
    const val = req.body[field];
    if (val === undefined || val === null) continue;

    if (typeof val === "string") {
      if (val.length < min) {
        return res.status(400).json({
          success: false,
          message: `${field} must be at least ${min} characters`,
        });
      }
      if (val.length > max) {
        return res.status(400).json({
          success: false,
          message: `${field} is too long (max ${max} characters)`,
        });
      }
    }
  }
  next();
};
