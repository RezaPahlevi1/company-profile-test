import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getPageSettings, getSiteSettings } from "../api/settings";

export default function usePageCheck(pageKey) {
  const navigate = useNavigate();

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings, // ✅ sama persis dengan App.jsx PageGuard
    staleTime: 1000 * 60 * 10,
  });

  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings, // ✅ gunakan fungsi dari api/settings langsung
    staleTime: 1000 * 60 * 10,
  });

  // Struktur: axios response → { data: { success, data: [...] } }
  const pageSettings = pageData?.data?.data || [];
  const siteSettings = siteData?.data?.data || {};

  const pageInfo = pageSettings.find((p) => p.page_key === pageKey);

  useEffect(() => {
    if (!isLoading && pageSettings.length > 0) {
      if (!pageInfo || (!pageInfo.is_active && pageKey !== "home")) {
        navigate("/404", { replace: true });
      }
    }
  }, [isLoading, pageSettings, pageInfo, navigate, pageKey]);

  return { pageInfo, siteSettings, isLoading };
}
