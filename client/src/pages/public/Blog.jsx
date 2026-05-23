import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { getBlogs, getCategories, getTags } from "../../api/blogs";
import BlogCard from "../../components/shared/BlogCard";
import SectionHeader from "../../components/ui/SectionHeader";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import usePageCheck from "../../hooks/usePageCheck";

export default function Blog() {
  const {
    pageInfo,
    siteSettings,
    isLoading: isPageLoading,
  } = usePageCheck("blog");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const { data: blogsData, isLoading: isBlogsLoading } = useQuery({
    queryKey: ["public-blogs", activeCategory, activeTag],
    queryFn: () =>
      getBlogs({
        status: "published",
        ...(activeCategory && { category: activeCategory }),
        ...(activeTag && { tag: activeTag }),
      }),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5,
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    staleTime: 1000 * 60 * 5,
  });

  const blogs = blogsData?.data?.data || [];
  const categories = categoriesData?.data?.data || [];
  const tags = tagsData?.data?.data || [];

  const filtered = blogs.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()),
  );

  if (isPageLoading) return <div className="min-h-screen"></div>;

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
        <div className="container-base relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-brand-300 font-semibold text-sm uppercase tracking-widest mb-4"
          >
            {pageInfo?.title || "Blog & Artikel"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Insight & Inspirasi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mt-4 max-w-xl mx-auto"
          >
            Tips, tren, dan wawasan terbaru seputar dunia digital dan teknologi.
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="container-base">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main content */}
            <div className="flex-1">
              {/* Search */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8"
              >
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari artikel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-11"
                />
              </motion.div>

              {isBlogsLoading ? (
                <Spinner size="lg" className="py-20" />
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="Artikel tidak ditemukan"
                  description="Coba ubah kata kunci atau filter kategori."
                />
              ) : (
                <>
                  <p className="text-slate-500 text-sm mb-6">
                    {filtered.length} artikel ditemukan
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map((blog, i) => (
                      <BlogCard key={blog.id} blog={blog} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-72 space-y-6">
              {/* Categories */}
              {categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card-base p-6"
                >
                  <h3 className="font-bold text-slate-900 mb-4">Kategori</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveCategory("")}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        activeCategory === ""
                          ? "bg-brand-50 text-brand-600 font-medium"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Semua Kategori
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(
                            activeCategory === cat.slug ? "" : cat.slug,
                          );
                          setActiveTag("");
                        }}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                          activeCategory === cat.slug
                            ? "bg-brand-50 text-brand-600 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="card-base p-6"
                >
                  <h3 className="font-bold text-slate-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          setActiveTag(activeTag === tag.slug ? "" : tag.slug);
                          setActiveCategory("");
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          activeTag === tag.slug
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
