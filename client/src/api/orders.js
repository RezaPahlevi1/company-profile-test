import axiosInstance from "./axiosInstance";

export const getOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axiosInstance.get(`/orders${query ? `?${query}` : ""}`);
};

export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`);

export const trackOrder = (orderNumber) =>
  axiosInstance.get(`/orders/track/${orderNumber}`);

export const createOrder = (data) => axiosInstance.post("/orders", data);

export const repayOrder = (orderNumber) =>
  axiosInstance.post(`/orders/${orderNumber}/repay`);

export const updateOrderStatus = (id, status, manualPaymentNote) =>
  axiosInstance.patch(`/orders/${id}/status`, {
    status,
    ...(manualPaymentNote && { manual_payment_note: manualPaymentNote }),
  });

// ✅ Update fulfillment — set tipe, status, shipping info
export const updateFulfillment = (id, data) =>
  axiosInstance.patch(`/orders/${id}/fulfillment`, data);

// ✅ Tandai under_review — shorthand untuk manual payment review
export const markOrderUnderReview = (id) =>
  axiosInstance.patch(`/orders/${id}/status`, { status: "under_review" });
