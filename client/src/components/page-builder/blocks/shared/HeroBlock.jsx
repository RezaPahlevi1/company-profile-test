import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { getColor, hexWithOpacity } from "../../blockColors";
import { useState, useEffect, useCallback, useRef } from "react";

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
    bg_images = [],
  } = content;

  const {
    bgType = "none",
    sliderAutoplay = false,
    sliderInterval = 5,
    overlayOpacity = 0.45,
  } = design || {};

  const isImageBg = bgType === "image" && bg_images.length > 0;
  const hasMultipleImages = bg_images.length > 1;

  const c = (key) => getColor(design, key, BLOCK_TYPE);

  // ─── Slider state ───────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const autoplayRef = useRef(null);

  const goTo = useCallback(
    (index) => {
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    },
    [activeIndex],
  );

  const goNext = useCallback(() => {
    const next = (activeIndex + 1) % bg_images.length;
    setDirection(1);
    setActiveIndex(next);
  }, [activeIndex, bg_images.length]);

  const goPrev = useCallback(() => {
    const prev = (activeIndex - 1 + bg_images.length) % bg_images.length;
    setDirection(-1);
    setActiveIndex(prev);
  }, [activeIndex, bg_images.length]);

  // ─── Autoplay ───────────────────────────────────────────────
  useEffect(() => {
    if (!isImageBg || !sliderAutoplay || !hasMultipleImages) return;

    const intervalMs = Math.max(2, Number(sliderInterval) || 5) * 1000;
    autoplayRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % bg_images.length);
    }, intervalMs);

    return () => clearInterval(autoplayRef.current);
  }, [
    isImageBg,
    sliderAutoplay,
    sliderInterval,
    hasMultipleImages,
    bg_images.length,
  ]);

  // ─── Reset index kalau jumlah gambar berubah ────────────────
  useEffect(() => {
    if (activeIndex >= bg_images.length) {
      setActiveIndex(0);
    }
  }, [bg_images.length, activeIndex]);

  // ─── Heading highlight ──────────────────────────────────────
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

  // ─── Button hover state ─────────────────────────────────────
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);

  const primaryBtnBg = c("primaryBtnBg");
  const secondaryBtnBg = c("secondaryBtnBg");

  // ─── Derive section bg style (non-image) ───────────────────
  const getSectionBgStyle = () => {
    if (isImageBg) return {};
    const {
      bgType: bt,
      bgColor,
      gradientStart,
      gradientEnd,
      gradientDirection,
    } = design || {};
    if (bt === "color" && bgColor) return { backgroundColor: bgColor };
    if (bt === "gradient" && gradientStart && gradientEnd) {
      return {
        background: `linear-gradient(${gradientDirection || "to right"}, ${gradientStart}, ${gradientEnd})`,
      };
    }
    return {};
  };

  // ─── Slider image fade variants ────────────────────────────
  const imageVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1, transition: { duration: 0.9, ease: "easeInOut" } },
    exit: { opacity: 0, transition: { duration: 0.9, ease: "easeInOut" } },
  };

  return (
    <section
      className={`relative overflow-hidden ${isHome ? "min-h-[90vh] flex items-center" : "py-24"} ${isCustomBg && !isImageBg ? "bg-transparent" : ""}`}
      style={getSectionBgStyle()}
    >
      {/* ── Background Image Slider ─────────────────────────── */}
      {isImageBg && (
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={activeIndex}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bg_images[activeIndex]})` }}
            />
          </AnimatePresence>

          {/* Overlay gelap */}
          <div
            className="absolute inset-0 z-10"
            style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
          />
        </div>
      )}

      {/* ── Default ambient glow (non-image bg only) ────────── */}
      {!isImageBg && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 opacity-30 bg-linear-to-tr from-blue-100 to-indigo-50 blur-[100px] rounded-full" />
          {isHome && (
            <div className="absolute bottom-0 right-0 w-150 h-150 opacity-20 bg-linear-to-tl from-purple-100 to-transparent blur-[120px] rounded-full" />
          )}
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="container mx-auto px-6 relative z-20">
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

      {/* ── Slider Controls — hanya muncul jika isImageBg ───── */}
      {isImageBg && hasMultipleImages && (
        <>
          {/* Arrow Kiri */}
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-105 focus:outline-none"
            aria-label="Gambar sebelumnya"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Arrow Kanan */}
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-all hover:scale-105 focus:outline-none"
            aria-label="Gambar berikutnya"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* ── Dots ─────────────────────────────────────────────── */}
      {isImageBg && hasMultipleImages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {bg_images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="focus:outline-none transition-all duration-300"
              aria-label={`Gambar ${i + 1}`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
