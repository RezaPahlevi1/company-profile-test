import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { getColor, hexWithOpacity } from "../../blockColors";
import { useState } from "react";

const BLOCK_TYPE = "hero";

export default function HeroBlock({ content, isCustomBg, design }) {
  const {
    variant = "page",
    badge_text,
    heading,
    heading_highlight,
    subheading,
    cta_primary_label,
    cta_primary_url,
    cta_secondary_label,
    cta_secondary_url,
  } = content;

  const c = (key) => getColor(design, key, BLOCK_TYPE);

  const renderHeading = () => {
    if (!heading_highlight || !heading?.includes(heading_highlight)) {
      return heading;
    }
    const parts = heading.split(heading_highlight);
    return (
      <>
        {parts[0]}
        <span
          style={{
            backgroundImage: `linear-gradient(to right, ${c("headingHighlightFrom")}, ${c("headingHighlightTo")})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {heading_highlight}
        </span>
        {parts[1]}
      </>
    );
  };

  const isHome = variant === "home";

  // Hover state untuk kedua tombol
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);

  const primaryBtnBg = c("primaryBtnBg");
  const secondaryBtnBg = c("secondaryBtnBg");

  return (
    <section
      className={`relative overflow-hidden ${isHome ? "min-h-[90vh] flex items-center" : "py-24"} ${isCustomBg ? "bg-transparent" : ""}`}
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 opacity-30 bg-linear-to-tr from-blue-100 to-indigo-50 blur-[100px] rounded-full" />
        {isHome && (
          <div className="absolute bottom-0 right-0 w-150 h-150 opacity-20 bg-linear-to-tl from-purple-100 to-transparent blur-[120px] rounded-full" />
        )}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className={`max-w-4xl ${isHome ? "mx-auto text-center" : ""}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {badge_text && (
              <div
                style={{
                  backgroundColor: c("badgeBg"),
                  color: c("badgeText"),
                  borderColor: hexWithOpacity(c("badgeText"), 0.2),
                }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 border ${isHome ? "mx-auto" : ""}`}
              >
                <span
                  style={{ backgroundColor: c("badgeText") }}
                  className="w-2 h-2 rounded-full animate-pulse"
                />
                {badge_text}
              </div>
            )}

            <h1
              style={{ color: c("heading") }}
              className={`font-bold tracking-tight mb-6 ${isHome ? "text-5xl md:text-7xl leading-tight" : "text-4xl md:text-5xl"}`}
            >
              {renderHeading()}
            </h1>

            <p
              style={{ color: c("subheading") }}
              className={`text-lg md:text-xl mb-10 ${isHome ? "mx-auto max-w-2xl" : "max-w-xl"}`}
            >
              {subheading}
            </p>

            {(cta_primary_label || cta_secondary_label) && (
              <div
                className={`flex flex-wrap gap-4 ${isHome ? "justify-center" : ""}`}
              >
                {cta_primary_label && cta_primary_url && (
                  <Link
                    to={cta_primary_url}
                    style={{
                      backgroundColor: primaryHovered
                        ? hexWithOpacity(primaryBtnBg, 0.85)
                        : primaryBtnBg,
                      color: c("primaryBtnText"),
                    }}
                    className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg shadow-sm hover:shadow transition-all group"
                    onMouseEnter={() => setPrimaryHovered(true)}
                    onMouseLeave={() => setPrimaryHovered(false)}
                  >
                    {cta_primary_label}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {cta_secondary_label && cta_secondary_url && (
                  <Link
                    to={cta_secondary_url}
                    style={{
                      backgroundColor: secondaryHovered
                        ? hexWithOpacity(secondaryBtnBg, 0.85)
                        : secondaryBtnBg,
                      color: c("secondaryBtnText"),
                      borderColor: c("secondaryBtnBorder"),
                    }}
                    className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium border rounded-lg shadow-sm transition-all group"
                    onMouseEnter={() => setSecondaryHovered(true)}
                    onMouseLeave={() => setSecondaryHovered(false)}
                  >
                    {cta_secondary_label}
                    <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform text-gray-400" />
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
