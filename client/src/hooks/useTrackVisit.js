import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const useTrackVisit = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;

    // Pakai sessionStorage agar tidak double-track di StrictMode
    const tracked = sessionStorage.getItem("home_tracked");
    if (tracked) return;

    axiosInstance
      .post("/analytics/track")
      .then(() => {
        sessionStorage.setItem("home_tracked", "true");
      })
      .catch(() => {});
  }, []);
};

export default useTrackVisit;
