import axiosInstance from "./axiosInstance";

export const getAnalytics = (range = "7d") =>
  axiosInstance.get(`/analytics/summary?range=${range}`);

export const getSalesAnalytics = (range = "7d") =>
  axiosInstance.get(`/analytics/sales?range=${range}`);
