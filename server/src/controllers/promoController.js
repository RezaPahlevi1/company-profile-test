import supabase from "../config/supabase.js";

export const getActivePromos = async (req, res) => {
  try {
    const [{ data: products, error: pErr }, { data: services, error: sErr }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, discount_percent, image_url")
          .eq("is_promo", true)
          .eq("is_active", true),
        supabase
          .from("services")
          .select("id, name, image_url")
          .eq("is_promo", true)
          .eq("is_active", true),
      ]);

    if (pErr) throw pErr;
    if (sErr) throw sErr;

    const hasPromo = products.length > 0 || services.length > 0;

    return res.status(200).json({
      success: true,
      data: {
        hasPromo,
        products: products.map((p) => ({
          ...p,
          promo_price: p.price - (p.price * p.discount_percent) / 100,
        })),
        services,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
