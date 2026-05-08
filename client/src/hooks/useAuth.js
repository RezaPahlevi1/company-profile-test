import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { getMe } from "../api/auth";

const useAuthVerify = () => {
  const { isAuthenticated, setAdmin, clearAdmin, _hasHydrated } =
    useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) return;

    getMe()
      .then((res) => {
        // ✅ Setelah kita ubah authStore untuk tidak persist data admin,
        // data admin harus diisi ulang dari server setiap app load
        const adminData = res.data?.data;
        if (adminData) {
          setAdmin(adminData);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          queryClient.clear();
          clearAdmin();
        }
      });
  }, [_hasHydrated]);
};

export default useAuthVerify;
