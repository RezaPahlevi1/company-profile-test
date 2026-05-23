import crypto from "crypto";

const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  
  // ✅ crypto.randomBytes — cryptographically secure random
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(6);
  const random = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
  
  return `ORD-${year}${month}${day}-${random}`;
};

export default generateOrderNumber;
