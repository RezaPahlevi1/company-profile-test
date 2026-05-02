import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Price must be a positive number'
    }),
  allow_negotiation: z.boolean().default(true),
  is_active: z.boolean().default(true),
})