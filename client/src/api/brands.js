import axiosInstance from "./axiosInstance";

export const getBrands = (all = false) =>
  axiosInstance.get(`/brands${all ? "?all=true" : ""}`);

export const createBrand = (formData) =>
  axiosInstance.post("/brands", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateBrand = (id, formData) =>
  axiosInstance.put(`/brands/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteBrand = (id) => axiosInstance.delete(`/brands/${id}`);
