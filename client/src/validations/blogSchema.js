import { z } from "zod";

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category_id: z.string().optional(),
  status: z.enum(["draft", "published"]),
  tags: z.array(z.string()).default([]),
});
