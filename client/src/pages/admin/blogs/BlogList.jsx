import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getBlogs, deleteBlog, getBlogById } from "../../../api/blogs";
import BlogForm from "./BlogForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const statusStyles = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

const ITEMS_PER_PAGE = 10;

export default function BlogList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isFetchingBlog, setIsFetchingBlog] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: () => getBlogs({ status: "all" }),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog deleted");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Delete failed");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
  });

  const handleEdit = async (blog) => {
    setIsFetchingBlog(true);
    try {
      const res = await getBlogById(blog.id);
      setSelected(res.data.data);
      setShowForm(true);
    } catch {
      toast.error("Failed to load blog data");
    } finally {
      setIsFetchingBlog(false);
    }
  };

  const handleClose = () => {
    setSelected(null);
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    const allBlogs = data?.data?.data || [];
    let result = allBlogs;
    if (filterStatus !== "all") {
      result = result.filter((b) => b.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }
    return result;
  }, [data, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleFilter = (val) => {
    setFilterStatus(val);
    setPage(1);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Blogs</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Blog</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari blog..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          >
            <option value="all">Semua</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">
            {search || filterStatus !== "all"
              ? "Tidak ada blog yang sesuai filter."
              : "No blogs yet. Write your first article."}
          </p>
          {(search || filterStatus !== "all") && (
            <button
              onClick={() => {
                handleSearch("");
                handleFilter("all");
              }}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ✅ Table di desktop, card list di mobile */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Published</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((blog) => (
                  <tr
                    key={blog.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.cover_image_url ? (
                          <img
                            src={blog.cover_image_url}
                            alt={blog.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {blog.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            /{blog.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {blog.categories?.name || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[blog.status]}`}
                      >
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {blog.published_at ? (
                        new Date(blog.published_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(blog)}
                          disabled={isFetchingBlog}
                          className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              id: blog.id,
                              name: blog.title,
                            })
                          }
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Card list di mobile */}
          <div className="lg:hidden space-y-2">
            {paginated.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3"
              >
                {/* Thumbnail */}
                {blog.cover_image_url ? (
                  <img
                    src={blog.cover_image_url}
                    alt={blog.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-1">
                    {blog.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[blog.status]}`}
                    >
                      {blog.status}
                    </span>
                    {blog.categories?.name && (
                      <span className="text-[10px] text-gray-400">
                        {blog.categories.name}
                      </span>
                    )}
                    {blog.published_at && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(blog.published_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEdit(blog)}
                    disabled={isFetchingBlog}
                    className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors border border-gray-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        id: blog.id,
                        name: blog.title,
                      })
                    }
                    className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors border border-gray-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {filtered.length} blog · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`e-${idx}`}
                        className="px-2 py-1.5 text-xs text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                          page === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <BlogForm
          key={selected?.id ?? "new"}
          blog={selected}
          onClose={handleClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
            handleClose();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Blog"
        message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
        onConfirm={() => remove(confirmModal.id)}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: "" })}
        isLoading={isDeleting}
      />
    </div>
  );
}
