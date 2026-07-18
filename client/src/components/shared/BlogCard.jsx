import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";

export default function BlogCard({ blog, index = 0 }) {
  // ✅ Guard — jika blog undefined/null (data belum ready), tidak crash
  if (!blog) return null;

  const formattedDate = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        to={`/blog/${blog.slug}`}
        className="card-base overflow-hidden group block"
      >
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {blog.cover_image_url ? (
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              width={600}
              height={192}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-brand-50 to-brand-100 flex items-center justify-center">
              <span className="text-brand-300 text-4xl font-bold">
                {blog.title?.charAt(0)}
              </span>
            </div>
          )}
          {blog.categories && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
              {blog.categories.name}
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors duration-200">
            {blog.title}
          </h3>

          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {formattedDate}
              </span>
            )}
            {blog.blog_tags?.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag size={12} />
                {blog.blog_tags
                  .slice(0, 2)
                  .map((bt) => bt.tags?.name)
                  .join(", ")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
