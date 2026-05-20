import axiosInstance from "./axiosInstance";

// ==================== SITE SETTINGS ====================

export const getSiteSettings = () => axiosInstance.get("/settings/site");

export const updateSiteSettings = (data) =>
  axiosInstance.put("/settings/site", data);

export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append("logo", file);
  return axiosInstance.post("/settings/logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteLogo = () => axiosInstance.delete("/settings/logo");

export const getPageSettings = () => axiosInstance.get("/settings/pages");

export const updatePageSetting = (key, data) =>
  axiosInstance.put(`/settings/pages/${key}`, data);

// ==================== PROMO SETTINGS ====================

export const getPromoSettings = () => axiosInstance.get("/promos/settings");

export const updatePromoSettings = (data) =>
  axiosInstance.put("/promos/settings", data);

export const uploadPromoBanner = (file) => {
  const formData = new FormData();
  formData.append("promo_banner", file);
  return axiosInstance.post("/promos/banner", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePromoBanner = () => axiosInstance.delete("/promos/banner");
