import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  X,
  Plus,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createBlog,
  updateBlog,
  getCategories,
  getTags,
  createCategory,
  createTag,
  deleteCategory as deleteCategoryApi,
  deleteTag as deleteTagApi,
} from "../../../api/blogs";
import { blogSchema } from "../../../validations/blogSchema";
import ConfirmModal from "../../../components/ui/ConfirmModal";
import useAuthStore from "../../../store/authStore";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

const validateImageFile = (file) => {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type))
    return "Hanya JPEG, PNG, dan WebP yang diperbolehkan";
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return `Ukuran file maksimal ${MAX_SIZE_MB}MB`;
  return null;
};

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url)
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
  };

  const buttons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      icon: <Bold size={14} />,
      title: "Bold",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      icon: <Italic size={14} />,
      title: "Italic",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      icon: <Heading2 size={14} />,
      title: "H2",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      icon: <Heading3 size={14} />,
      title: "H3",
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      icon: <List size={14} />,
      title: "Bullet",
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      icon: <ListOrdered size={14} />,
      title: "Ordered",
    },
    {
      action: setLink,
      active: editor.isActive("link"),
      icon: <LinkIcon size={14} />,
      title: "Link",
    },
    {
      action: addImage,
      active: false,
      icon: <ImageIcon size={14} />,
      title: "Image",
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {buttons.map(({ action, active, icon, title }) => (
        <button
          key={title}
          type="button"
          onClick={action}
          title={title}
          className={`p-2 rounded text-sm transition-colors ${active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-200"}`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

("use no memo");

export default function BlogForm({ blog, onClose, onSuccess }) {
  const isEdit = Boolean(blog);
  const queryClient = useQueryClient();
  const coverRef = useRef(null);
  const [coverError, setCoverError] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  // ✅ Ambil role dari authStore untuk kondisikan UI
  const { admin } = useAuthStore();
  const isSuperAdmin = admin?.role === "superadmin";

  // ✅ State untuk confirm delete category
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
    blogCount: 0,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
  const { data: tagsData } = useQuery({ queryKey: ["tags"], queryFn: getTags });

  const categories = useMemo(
    () => categoriesData?.data?.data || [],
    [categoriesData],
  );
  const tags = useMemo(() => tagsData?.data?.data || [], [tagsData]);

  // ✅ Ambil data blogs dari cache untuk hitung blog count per category
  // Pakai getQueryData — tidak trigger fetch baru
  const blogsCache = queryClient.getQueryData(["admin-blogs"]);
  const allBlogs = useMemo(() => blogsCache?.data?.data || [], [blogsCache]);

  // ✅ Hitung berapa blog per category_id
  const blogCountByCategory = useMemo(() => {
    return allBlogs.reduce((acc, blog) => {
      if (blog.category_id) {
        acc[blog.category_id] = (acc[blog.category_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [allBlogs]);

  const [selectedTags, setSelectedTags] = useState(
    () => blog?.blog_tags?.map((bt) => bt.tags).filter(Boolean) || [],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      content: "",
      category_id: "",
      status: "draft",
      tags: [],
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Start writing your blog content here...",
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => setValue("content", editor.getHTML()),
  });

  useEffect(() => {
    if (!blog) return;
    reset({
      title: blog.title,
      content: blog.content || "",
      category_id: blog.category_id || "",
      status: blog.status,
      tags: blog.blog_tags?.map((bt) => bt.tags?.id).filter(Boolean) || [],
    });
  }, [blog, reset]);

  useEffect(() => {
    if (!blog || !editor || editor.isDestroyed) return;
    const timer = setTimeout(() => {
      editor.commands.setContent(blog.content || "");
      setValue("content", blog.content || "");
    }, 100);
    return () => clearTimeout(timer);
  }, [blog, editor, setValue]);

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation(
    {
      mutationFn: deleteCategoryApi,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
        setConfirmDeleteCategory({
          isOpen: false,
          categoryId: null,
          categoryName: "",
          blogCount: 0,
        });
        toast.success("Category and its blogs deleted");
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to delete category");
        setConfirmDeleteCategory({
          isOpen: false,
          categoryId: null,
          categoryName: "",
          blogCount: 0,
        });
      },
    },
  );

  const { mutate: removeTag } = useMutation({
    mutationFn: deleteTagApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete tag"),
  });

  const { mutate: addCategory, isPending: isAddingCategory } = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory("");
      toast.success("Category added");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add category"),
  });

  const { mutate: addTag, isPending: isAddingTag } = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTag("");
      toast.success("Tag added");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add tag"),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) =>
      isEdit ? updateBlog(blog.id, formData) : createBlog(formData),
    onSuccess: () => {
      toast.success(isEdit ? "Blog updated" : "Blog created");
      onSuccess();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Something went wrong"),
  });

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      return exists ? prev.filter((t) => t.id !== tag.id) : [...prev, tag];
    });
  }, []);

  // ✅ Handler untuk buka confirm modal delete category
  const handleDeleteCategoryClick = useCallback(
    (cat) => {
      const count = blogCountByCategory[cat.id] || 0;
      setConfirmDeleteCategory({
        isOpen: true,
        categoryId: cat.id,
        categoryName: cat.name,
        blogCount: count,
      });
    },
    [blogCountByCategory],
  );

  const handleFormSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      handleSubmit(
        (data) => {
          const content = editor?.getHTML() || "";
          if (!content || content === "<p></p>") {
            toast.error("Content is required");
            return;
          }

          const file = coverRef.current?.files[0];
          if (file) {
            const fileError = validateImageFile(file);
            if (fileError) {
              setCoverError(fileError);
              return;
            }
          }
          setCoverError(null);

          const formData = new FormData();
          formData.append("title", data.title);
          formData.append("content", content);
          formData.append("category_id", data.category_id || "");
          formData.append("status", data.status);
          formData.append(
            "tags",
            JSON.stringify(selectedTags.map((t) => t.id)),
          );
          if (file) formData.append("cover_image", file);

          mutate(formData);
        },
        (validationErrors) => {
          if (validationErrors.title) toast.error("Title is required");
          if (validationErrors.category_id) toast.error("Category is required");
          if (validationErrors.content) toast.error("Content is required");
        },
      )(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, selectedTags, mutate],
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:px-4 sm:py-6">
        <div className="bg-white w-full sm:rounded-xl shadow-xl sm:max-w-3xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              {isEdit ? "Edit Blog" : "Add Blog"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog title"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                {isEdit && blog.cover_image_url && (
                  <img
                    src={blog.cover_image_url}
                    alt="Cover"
                    className="w-full h-36 object-cover rounded-lg mb-2"
                  />
                )}
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={() => setCoverError(null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {coverError && (
                  <p className="text-red-500 text-xs mt-1">{coverError}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Max 5MB. JPEG, PNG, WebP.
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <MenuBar editor={editor} />
                  <EditorContent
                    editor={editor}
                    className="prose prose-sm max-w-none p-3 sm:p-4 min-h-45 sm:min-h-20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <select
                      {...register("category_id")}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.category_id.message}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category"
                      className="flex-1 sm:w-36 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={!newCategory.trim() || isAddingCategory}
                      onClick={() => addCategory({ name: newCategory.trim() })}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors shrink-0"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* ✅ Daftar kategori — tombol delete hanya muncul untuk superadmin */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((cat) => {
                      const count = blogCountByCategory[cat.id] || 0;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1"
                        >
                          <span className="text-xs text-gray-600">
                            {cat.name}
                          </span>
                          {/* ✅ Tampilkan badge jumlah blog di kategori ini */}
                          {count > 0 && (
                            <span className="text-[10px] bg-gray-300 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
                              {count}
                            </span>
                          )}
                          {/* ✅ Hanya superadmin yang bisa delete category */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategoryClick(cat)}
                              className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.some(
                      (t) => t.id === tag.id,
                    );
                    return (
                      <div key={tag.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {tag.name}
                        </button>
                        {/* ✅ Hanya superadmin yang bisa delete tag */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag"
                    className="flex-1 sm:w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    disabled={!newTag.trim() || isAddingTag}
                    onClick={() => addTag({ name: newTag.trim() })}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg text-sm transition-colors shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="h-2" />
            </form>
          </div>

          {/* Sticky footer */}
          <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Confirm delete category modal */}
      <ConfirmModal
        isOpen={confirmDeleteCategory.isOpen}
        title={`Hapus Kategori "${confirmDeleteCategory.categoryName}"?`}
        message={
          confirmDeleteCategory.blogCount > 0
            ? `Kategori ini memiliki ${confirmDeleteCategory.blogCount} blog. Semua blog tersebut akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
            : "Kategori ini tidak memiliki blog. Tindakan ini tidak bisa dibatalkan."
        }
        confirmLabel="Ya, Hapus"
        variant="danger"
        onConfirm={() => deleteCategory(confirmDeleteCategory.categoryId)}
        onCancel={() =>
          setConfirmDeleteCategory({
            isOpen: false,
            categoryId: null,
            categoryName: "",
            blogCount: 0,
          })
        }
        isLoading={isDeletingCategory}
      />
    </>
  );
}
