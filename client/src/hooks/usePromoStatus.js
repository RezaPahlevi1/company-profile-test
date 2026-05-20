import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

const getActivePromos = () => axiosInstance.get("/promos");

// Hook shared untuk status kampanye promo.
// Dipakai oleh PromoPopup, ProductCard, ServiceCard, ProductDetail,
// Products, Services — semua baca dari cache yang sama (queryKey: ["active-promos"])
// sehingga hanya ada satu fetch ke /api/promos per session.
export default function usePromoStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ["active-promos"],
    queryFn: getActivePromos,
    staleTime: 1000 * 60 * 5, // 5 menit — sama dengan PromoPopup sebelumnya
  });

  const promoData = data?.data?.data;

  return {
    // Apakah kampanye sedang aktif (sudah include pengecekan tanggal di backend)
    campaignActive: promoData?.campaignActive ?? false,
    // Apakah ada minimal satu produk/service promo
    hasPromo: promoData?.hasPromo ?? false,
    // Info kampanye: { title, description, banner_url }
    campaign: promoData?.campaign ?? null,
    // List produk dan service yang promo
    promoProducts: promoData?.products ?? [],
    promoServices: promoData?.services ?? [],
    isLoading,
  };
}
