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

export const getRecipientPreview = () =>
  axiosInstance.get("/email/broadcasts/recipients/preview");

export const sendBroadcast = (id) =>
  axiosInstance.post(`/email/broadcasts/${id}/send`);
