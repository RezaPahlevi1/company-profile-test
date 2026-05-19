import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../store/authStore";
import { getMe } from "../api/auth";

const useAuthVerify = () => {
  const { isAuthenticated, setAdmin, clearAdmin, _hasHydrated } =
    useAuthStore();
  const queryClient = useQueryClient();

  // ✅ Guard agar tidak fire lebih dari sekali dalam satu mount
  // Mencegah React StrictMode double-invoke di development
  const hasFired = useRef(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) return;
    if (hasFired.current) return;

    hasFired.current = true;

    getMe()
      .then((res) => {
        const adminData = res.data?.data;
        if (adminData) {
          setAdmin(adminData);
        }
      })
      .catch((err) => {
        const status = err.response?.status;

        // ✅ Hanya clearAdmin untuk 401 — token benar-benar tidak valid
        if (status === 401) {
          queryClient.clear();
          clearAdmin();
          return;
        }

        // ✅ 429 (rate limit) atau error jaringan — jangan clearAdmin
        // User masih login, hanya request yang gagal sementara
        // Biarkan saja, state tidak berubah
        if (status === 429) {
          console.warn(
            "[useAuthVerify] Rate limited — skipping, will retry on next load",
          );
          return;
        }

        // Error lain (500, network error) — juga tidak clearAdmin
        // Jangan logout user hanya karena server sedang bermasalah
        console.warn("[useAuthVerify] Auth check failed, status:", status);
      });
  }, [_hasHydrated, isAuthenticated]);
};

export default useAuthVerify;
