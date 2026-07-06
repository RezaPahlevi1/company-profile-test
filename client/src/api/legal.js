import axiosInstance from "./axiosInstance";

export const getLegalPage = (key) => axiosInstance.get(`/legal/${key}`);

export const updateLegalPage = (key, data) =>
  axiosInstance.put(`/legal/${key}`, data);
