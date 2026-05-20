import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "../../api/settings";

export default function WhatsAppButton({
  productName,
  message,
  className = "",
  variant = "full",
}) {
  // Baca nomor WA dari site-settings — pakai cache React Query (staleTime 10 menit)
  // sehingga tidak ada fetch tambahan jika halaman sudah fetch site-settings sebelumnya
  const { data: siteData, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const waNumber = siteData?.data?.data?.whatsapp_number;
  const isReady = !isLoading && !!waNumber;

  const defaultMessage =
    message ||
    `Halo, saya tertarik dengan ${productName}. Boleh saya tahu informasi lebih lanjut?`;

  const waUrl = isReady
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`
    : "#";

  if (variant === "icon") {
    return (
      <a
        href={waUrl}
        target={isReady ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-disabled={!isReady}
        onClick={!isReady ? (e) => e.preventDefault() : undefined}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
          ${
            isReady
              ? "bg-green-500 hover:bg-green-600 text-white hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          } ${className}`}
        title={isReady ? "Chat via WhatsApp" : "Memuat..."}
      >
        <MessageCircle size={18} />
      </a>
    );
  }

  return (
    <a
      href={waUrl}
      target={isReady ? "_blank" : undefined}
      rel="noopener noreferrer"
      aria-disabled={!isReady}
      onClick={!isReady ? (e) => e.preventDefault() : undefined}
      className={`inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all duration-200
        ${
          isReady
            ? "bg-green-500 hover:bg-green-600 text-white hover:scale-105 hover:shadow-lg shadow-green-200"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        } ${className}`}
    >
      <MessageCircle size={18} />
      {isLoading ? "Loading..." : "Hubungi via WhatsApp"}
    </a>
  );
}
