const sanitizeString = (val) => {
  if (typeof val !== "string") return val;
  return val.trim().replace(/\s+/g, " ");
};

const sanitizeValue = (val) => {
  if (typeof val === "string") {
    return sanitizeString(val);
  }

  if (Array.isArray(val)) {
    // ✅ Rekursif untuk array — cover recipient_emails, items, tags, dll
    return val.map((item) => sanitizeValue(item));
  }

  if (val !== null && typeof val === "object") {
    return sanitizeObject(val);
  }

  // number, boolean, null — pass through
  return val;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
};

// ✅ Middleware — sanitasi semua string di req.body termasuk nested array/object
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
