import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getColor, hexWithOpacity } from "../../blockColors";

const BLOCK_TYPE = "cta";

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

  const c = (key) => getColor(design, key, BLOCK_TYPE);
  const cardBgStyle = getCardBgStyle(design);

  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);

  const primaryBtnBg = c("primaryBtnBg");
  const secondaryBtnText = c("secondaryBtnText");
  const secondaryBtnBorder = c("secondaryBtnBorder");

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div
          className="max-w-4xl mx-auto rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden"
          style={cardBgStyle}
        >
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />

          <div className="relative z-10 text-center">
            {heading && (
              <h2
                style={{ color: c("heading") }}
                className="text-3xl md:text-5xl font-bold mb-6 tracking-tight"
              >
                {heading}
              </h2>
            )}
            {subheading && (
              <p
                style={{ color: hexWithOpacity(c("subheading"), 0.8) }}
                className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
              >
                {subheading}
              </p>
            )}

            {(cta_primary_label || cta_secondary_label) && (
              <div className="flex flex-wrap justify-center gap-4">
                {cta_primary_label && cta_primary_url && (
                  <Link
                    to={cta_primary_url}
                    style={{
                      backgroundColor: primaryHovered
                        ? hexWithOpacity(primaryBtnBg, 0.9)
                        : primaryBtnBg,
                      color: c("primaryBtnText"),
                    }}
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all group"
                    onMouseEnter={() => setPrimaryHovered(true)}
                    onMouseLeave={() => setPrimaryHovered(false)}
                  >
                    {cta_primary_label}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {cta_secondary_label && cta_secondary_url && (
                  <Link
                    to={cta_secondary_url}
                    style={{
                      color: secondaryHovered
                        ? hexWithOpacity(secondaryBtnText, 0.7)
                        : secondaryBtnText,
                      backgroundColor: secondaryHovered
                        ? hexWithOpacity(secondaryBtnText, 0.2)
                        : hexWithOpacity(secondaryBtnText, 0.1),
                      borderColor: hexWithOpacity(secondaryBtnBorder, 0.2),
                    }}
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium border rounded-xl transition-all"
                    onMouseEnter={() => setSecondaryHovered(true)}
                    onMouseLeave={() => setSecondaryHovered(false)}
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
