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

export const updateOrderStatus = (id, status) =>
  axiosInstance.patch(`/orders/${id}/status`, { status });
