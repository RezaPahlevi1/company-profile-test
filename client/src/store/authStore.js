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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useAuthStore;
