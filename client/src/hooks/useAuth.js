import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { getMe } from "../api/auth";

const useAuthVerify = () => {
  const { isAuthenticated, clearAdmin, _hasHydrated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) return;

    // Verifikasi token ke backend saat app load
    getMe()
      .then(() => {
        // Token valid, tidak perlu lakukan apa-apa
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          // Token tidak valid — clear semua
          queryClient.clear();
          clearAdmin();
        }
      });
  }, [_hasHydrated]);
};

export default useAuthVerify;
