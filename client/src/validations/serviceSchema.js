import { z } from "zod";

export const serviceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama layanan wajib diisi")
      .max(150, "Nama terlalu panjang"),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
    is_promo: z.boolean().default(false),
    is_orderable: z.boolean().default(false),
    price: z.string().optional(),
    discount_percent: z.string().optional(),
    delivery_estimation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.is_orderable) return true;
      const price = parseFloat(data.price);
      return !isNaN(price) && price > 0;
    },
    {
      message:
        "Harga wajib diisi dan lebih dari 0 untuk layanan yang bisa dipesan online",
      path: ["price"],
    },
  );
