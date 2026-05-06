import axiosInstance from "./axiosInstance";

export const getAnalytics = (range = "7d") =>
  axiosInstance.get(`/analytics/summary?range=${range}`);
