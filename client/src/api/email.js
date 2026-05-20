import axiosInstance from "./axiosInstance";

export const getTemplates = () => axiosInstance.get("/email/templates");

export const getEmailTemplate = (key) =>
  axiosInstance.get(`/email/templates/${key}`);

export const updateEmailTemplate = (key, data) =>
  axiosInstance.put(`/email/templates/${key}`, data);

export const resetEmailTemplate = (key) =>
  axiosInstance.post(`/email/templates/${key}/reset`);

export const getBroadcasts = () => axiosInstance.get("/email/broadcasts");

export const createBroadcast = (data) =>
  axiosInstance.post("/email/broadcasts", data);

export const updateBroadcast = (id, data) =>
  axiosInstance.put(`/email/broadcasts/${id}`, data);

export const deleteBroadcast = (id) =>
  axiosInstance.delete(`/email/broadcasts/${id}`);

// ✅ Ganti preview → recipients (return semua)
export const getRecipients = () =>
  axiosInstance.get("/email/broadcasts/recipients");

// ✅ Tidak perlu selected_emails lagi di frontend
export const sendBroadcast = (id) =>
  axiosInstance.post(`/email/broadcasts/${id}/send`);

// ✅ Tambah di bagian bawah
export const uploadBroadcastImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);
  return axiosInstance.post("/email/broadcasts/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
