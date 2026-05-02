import axiosInstance from "./axiosInstance";

export const loginAdmin = (credentials) =>
  axiosInstance.post("/auth/login", credentials);

export const logoutAdmin = () => axiosInstance.post("/auth/logout");

export const getMe = () => axiosInstance.get("/auth/me");
