import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    // ✅ Kalau 401 dan bukan dari endpoint login atau getMe
    // berarti token expired — redirect ke login
    const isAuthEndpoint =
      url.includes("/auth/login") || url.includes("/auth/me");

    if (status === 401 && !isAuthEndpoint) {
      // ✅ Hanya redirect kalau sedang di halaman admin
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
