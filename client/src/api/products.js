import axiosInstance from "./axiosInstance";

export const getProducts = (all = false) =>
  axiosInstance.get(`/products${all ? "?all=true" : ""}`);

export const getProductById = (id) => axiosInstance.get(`/products/${id}`);

export const createProduct = (formData) =>
  axiosInstance.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateProduct = (id, formData) =>
  axiosInstance.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`);
