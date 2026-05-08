import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAdmin: (admin) => set({ admin, isAuthenticated: true }),
      clearAdmin: () => set({ admin: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "admin-auth",
      // ✅ Hanya persist isAuthenticated — bukan data admin
      // Data admin di-refetch dari server via useAuthVerify setiap load
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useAuthStore;
