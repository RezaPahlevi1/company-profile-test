import { z } from "zod";

export const brandSchema = z.object({
  name: z
    .string()
    .min(1, "Nama brand wajib diisi")
    .max(100, "Nama brand maksimal 100 karakter"),
  is_active: z.boolean(),
});
