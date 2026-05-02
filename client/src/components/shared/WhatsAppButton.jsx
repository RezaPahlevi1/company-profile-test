import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({
  productName,
  message,
  className = "",
  variant = "full",
}) {
  const waNumber = import.meta.env.VITE_WA_NUMBER || "628123456789";
  const defaultMessage =
    message ||
    `Halo, saya tertarik dengan ${productName}. Boleh saya tahu informasi lebih lanjut?`;

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`;

  if (variant === "icon") {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 hover:scale-105 ${className}`}
        title="Chat via WhatsApp"
      >
        <MessageCircle size={18} />
      </a>
    );
  }

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-green-200 ${className}`}
    >
      <MessageCircle size={18} />
      Hubungi via WhatsApp
    </a>
  );
}
