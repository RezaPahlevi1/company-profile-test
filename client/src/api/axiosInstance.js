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
    // Jangan redirect di sini — biarkan useAuthVerify yang handle
    // Hanya reject agar caller bisa handle sendiri
    return Promise.reject(error);
  },
);

export default axiosInstance;
