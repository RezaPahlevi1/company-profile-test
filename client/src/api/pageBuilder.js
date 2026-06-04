import axiosInstance from "./axiosInstance";

// ─────────────────────────────────────────────
// Page Config
// ─────────────────────────────────────────────

export const getPageConfig = (pageKey) =>
  axiosInstance.get(`/page-builder/${pageKey}`);

export const updatePageConfig = (pageKey, blocks) =>
  axiosInstance.put(`/page-builder/${pageKey}`, { blocks });

// ─────────────────────────────────────────────
// Hero Image Upload
// Upload satu gambar — dipanggil sekuensial untuk tiap gambar
// ─────────────────────────────────────────────
export const uploadHeroImage = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return axiosInstance.post("/page-builder/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ─────────────────────────────────────────────
// Hero Image Delete
// Hapus gambar dari Supabase Storage by URL
// ─────────────────────────────────────────────
export const deleteHeroImage = (url) =>
  axiosInstance.delete("/page-builder/delete-image", {
    data: { url },
  });
