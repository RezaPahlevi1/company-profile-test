import api from "./axiosInstance";

export const getPageConfig = (pageKey) =>
  api.get(`/page-builder/${pageKey}`);

export const updatePageConfig = (pageKey, blocks) =>
  api.put(`/page-builder/${pageKey}`, { blocks });