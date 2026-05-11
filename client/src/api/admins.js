import api from "./axiosInstance";

export const getAdmins = () => api.get("/admin/admins");

export const createAdmin = (data) => api.post("/admin/admins", data);

export const updateAdmin = (id, data) => api.put(`/admin/admins/${id}`, data);

export const deleteAdmin = (id) => api.delete(`/admin/admins/${id}`);
