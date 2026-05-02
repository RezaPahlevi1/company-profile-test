import axiosInstance from "./axiosInstance";

export const getServices = (all = false) =>
  axiosInstance.get(`/services${all ? "?all=true" : ""}`);

export const getServiceById = (id) => axiosInstance.get(`/services/${id}`);

export const createService = (formData) =>
  axiosInstance.post("/services", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateService = (id, formData) =>
  axiosInstance.put(`/services/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteService = (id) => axiosInstance.delete(`/services/${id}`);
