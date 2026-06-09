import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "../api/settings";

export default function useSiteTitle() {
  const { data } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: getSiteSettings,
    staleTime: 5 * 60 * 1000,
  });

  const siteName = data?.data?.data?.site_name;
  const logoUrl = data?.data?.data?.navbar_logo_url;

  // ✅ Set title
  useEffect(() => {
    if (siteName) {
      document.title = siteName;
    }
  }, [siteName]);

  // ✅ Set favicon dari logo navbar — dengan canvas agar proporsional
  useEffect(() => {
    if (!logoUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");

      // ✅ Background transparan — tidak perlu fill

      // ✅ Hitung ukuran gambar agar proporsional dengan padding
      const padding = 4;
      const maxSize = 64 - padding * 2;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      const drawWidth = img.width * ratio;
      const drawHeight = img.height * ratio;

      // ✅ Posisikan di tengah canvas
      const offsetX = (64 - drawWidth) / 2;
      const offsetY = (64 - drawHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const link =
        document.querySelector("link[rel='icon']") ||
        document.createElement("link");

      link.rel = "icon";
      link.href = canvas.toDataURL("image/png");
      link.removeAttribute("type");

      if (!document.querySelector("link[rel='icon']")) {
        document.head.appendChild(link);
      }
    };

    img.src = logoUrl;
  }, [logoUrl]);
}
