import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

// ✅ Whitelist MIME type — SVG dihapus karena bisa mengandung script
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// ✅ Whitelist ekstensi — double check selain MIME
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error("Invalid file extension"), false);
  }

  // ✅ Tolak filename yang mencurigakan
  const safeName = /^[\w\-. ]+$/;
  if (!safeName.test(file.originalname)) {
    return cb(new Error("Invalid filename"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, //  maksimal 1 file per request
    fields: 20, //  maksimal 20 form fields
  },
});

export default upload;
