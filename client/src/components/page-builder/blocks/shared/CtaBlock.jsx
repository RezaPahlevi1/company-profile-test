import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function getCardBgStyle(design) {
  if (!design) return null;

  if (design.cardBgType === "color" && design.cardBgColor) {
    return { backgroundColor: design.cardBgColor };
  }

  if (design.cardBgType === "gradient") {
    const dir = design.cardGradientDirection || "to bottom right";
    const start = design.cardGradientStart || "#1e3a5f";
    const end = design.cardGradientEnd || "#1e40af";
    return { background: `linear-gradient(${dir}, ${start}, ${end})` };
  }

  // default — gradien biru gelap
  return { background: "linear-gradient(to bottom right, #1e3a5f, #1e40af)" };
}

export default function CtaBlock({ content, isCustomBg, design }) {
  const {
    heading,
    subheading,
    cta_primary_label,
    cta_primary_url,
    cta_secondary_label,
    cta_secondary_url,
  } = content || {};

  const cardBgStyle = getCardBgStyle(design);
  const hasCustomCardBg = design?.cardBgType && design.cardBgType !== "default";
  const primaryBtnTextColor = hasCustomCardBg
    ? "text-gray-800"
    : "text-blue-600";

  return (
    // ✅ Section hanya handle background luar — dari BlockRenderer wrapper
    // Tidak ada absolute div yang menutupi section
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        {/* ✅ Background card ada di sini — bukan di absolute div level section */}
        <div
          className="max-w-4xl mx-auto rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden"
          style={cardBgStyle}
        >
          {/* Orb dekoratif di dalam card — tidak overflow ke section */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />

          {/* Konten — z-10 agar di atas orb */}
          <div className="relative z-10 text-center">
            {heading && (
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                {subheading}
              </p>
            )}

            {(cta_primary_label || cta_secondary_label) && (
              <div className="flex flex-wrap justify-center gap-4">
                {cta_primary_label && cta_primary_url && (
                  <Link
                    to={cta_primary_url}
                    className={`inline-flex items-center justify-center px-8 py-4 text-base font-medium ${primaryBtnTextColor} bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all group`}
                  >
                    {cta_primary_label}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {cta_secondary_label && cta_secondary_url && (
                  <Link
                    to={cta_secondary_url}
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
                  >
                    {cta_secondary_label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
