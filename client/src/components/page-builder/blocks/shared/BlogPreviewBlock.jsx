import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getBlogs } from "../../../../api/blogs";
import BlogCard from "../../../shared/BlogCard";
import Spinner from "../../../ui/Spinner";
import { getColor, hexWithOpacity } from "../../blockColors";

const BLOCK_TYPE = "blog_preview";

export default function BlogPreviewBlock({ content, isCustomBg, design }) {
  const { label, title, subtitle, count = 3 } = content;
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  const [linkHovered, setLinkHovered] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["public-blogs-preview"],
    queryFn: () => getBlogs(),
  });

  const blogs = data?.data?.data || [];
  const previewBlogs = blogs.slice(0, count);

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            {label && (
              <div
                style={{
                  backgroundColor: c("labelBg"),
                  color: c("labelText"),
                }}
                className="inline-block px-3 py-1 rounded-full text-sm font-semibold tracking-wide uppercase mb-4"
              >
                {label}
              </div>
            )}
            {title && (
              <h2
                style={{ color: c("title") }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ color: c("subtitle") }} className="text-lg">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            to="/blog"
            style={{
              color: linkHovered
                ? hexWithOpacity(c("linkText"), 0.75)
                : c("linkText"),
            }}
            className="inline-flex items-center font-medium transition-colors group whitespace-nowrap"
            onMouseEnter={() => setLinkHovered(true)}
            onMouseLeave={() => setLinkHovered(false)}
          >
            Lihat Semua Artikel
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-20" />
        ) : previewBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewBlogs.map((blog, index) => (
              <BlogCard key={blog.id} blog={blog} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Belum ada artikel yang diterbitkan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
