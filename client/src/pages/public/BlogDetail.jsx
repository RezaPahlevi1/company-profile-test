import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowLeft, User } from "lucide-react";
import { getBlogBySlug } from "../../api/blogs";
import Spinner from "../../components/ui/Spinner";
import sanitizeHtml from "../../utils/sanitizeHtml";

export default function BlogDetail() {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => getBlogBySlug(slug),
  });

  const blog = data?.data?.data;

  if (isLoading) return <Spinner size="lg" className="min-h-screen" />;

  if (!blog) {
    return (
      <main className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-lg">Artikel tidak ditemukan.</p>
          <Link to="/blog" className="btn-primary mt-6 inline-flex">
            Kembali ke Blog
          </Link>
        </div>
      </main>
    );
  }

  const formattedDate = blog.published_at
    ? new Date(blog.published_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container-base relative z-10 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft size={16} />
              Kembali ke Blog
            </Link>

            {blog.categories && (
              <span className="inline-block bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {blog.categories.name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-slate-400">
              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formattedDate}
                </span>
              )}
              {blog.blog_tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} />
                  {blog.blog_tags.map(
                    (bt) =>
                      bt.tags && (
                        <span
                          key={bt.tags.id}
                          className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs"
                        >
                          #{bt.tags.name}
                        </span>
                      ),
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover Image */}
      {blog.cover_image_url && (
        <div className="bg-slate-100">
          <div className="container-base max-w-3xl mx-auto">
            <motion.img
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full max-h-96 object-cover rounded-b-2xl shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-base max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg prose-slate max-w-none
              prose-headings:font-bold prose-headings:text-slate-900
              prose-p:text-slate-600 prose-p:leading-relaxed
              prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-2xl prose-img:shadow-md
              prose-blockquote:border-brand-500 prose-blockquote:text-slate-500
              prose-strong:text-slate-900
              prose-code:text-brand-600 prose-code:bg-brand-50 prose-code:px-1 prose-code:rounded"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(blog.content || ""),
            }}
          />

          {/* Tags */}
          {blog.blog_tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-slate-100">
              <span className="text-slate-500 text-sm font-medium">Tags:</span>
              {blog.blog_tags.map(
                (bt) =>
                  bt.tags && (
                    <Link
                      key={bt.tags.id}
                      to={`/blog?tag=${bt.tags.slug}`}
                      className="bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 px-3 py-1 rounded-full text-xs font-medium transition-colors"
                    >
                      #{bt.tags.name}
                    </Link>
                  ),
              )}
            </div>
          )}

          {/* Back */}
          <div className="mt-10">
            <Link to="/blog" className="btn-outline inline-flex">
              <ArrowLeft size={16} />
              Kembali ke Blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
