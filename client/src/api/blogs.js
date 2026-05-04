import axiosInstance from "./axiosInstance";

export const getBlogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axiosInstance.get(`/blogs${query ? `?${query}` : ""}`);
};

export const getBlogById = (id) => axiosInstance.get(`/blogs/id/${id}`);

export const getBlogBySlug = (slug) => axiosInstance.get(`/blogs/${slug}`);

export const createBlog = (formData) =>
  axiosInstance.post("/blogs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateBlog = (id, formData) =>
  axiosInstance.put(`/blogs/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteBlog = (id) => axiosInstance.delete(`/blogs/${id}`);

export const getCategories = () => axiosInstance.get("/blogs/categories");

export const getTags = () => axiosInstance.get("/blogs/tags");

export const createCategory = (data) =>
  axiosInstance.post("/blogs/categories", data);

export const createTag = (data) => axiosInstance.post("/blogs/tags", data);

export const deleteCategory = (id) =>
  axiosInstance.delete(`/blogs/categories/${id}`);

export const deleteTag = (id) => axiosInstance.delete(`/blogs/tags/${id}`);
