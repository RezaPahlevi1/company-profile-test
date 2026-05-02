import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getBlogs, deleteBlog, getBlogById } from "../../../api/blogs";
import BlogForm from "./BlogForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const statusStyles = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

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

  const blogs = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blogs</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Blog
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-400">
            No blogs yet. Write your first article.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
              {blogs.map((blog) => (
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
                      new Date(blog.published_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
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
                        title="Edit"
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
                        title="Delete"
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
      )}

      {showForm && (
        <BlogForm
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
