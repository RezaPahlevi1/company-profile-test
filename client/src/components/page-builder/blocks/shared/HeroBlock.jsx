import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function HeroBlock({ content, isCustomBg }) {
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

  // Split heading by highlight to apply special styling
  const renderHeading = () => {
    if (!heading_highlight || !heading.includes(heading_highlight)) {
      return heading;
    }
    const parts = heading.split(heading_highlight);
    return (
      <>
        {parts[0]}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          {heading_highlight}
        </span>
        {parts[1]}
      </>
    );
  };

  const isHome = variant === "home";

  return (
    <section className={`relative overflow-hidden ${isHome ? "min-h-[90vh] flex items-center" : "py-24"} ${isCustomBg ? "bg-transparent" : ""}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 bg-gradient-to-tr from-blue-100 to-indigo-50 blur-[100px] rounded-full" />
        {isHome && (
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-20 bg-gradient-to-tl from-purple-100 to-transparent blur-[120px] rounded-full" />
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
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6 border border-blue-100 ${isHome ? "mx-auto" : ""}`}>
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                {badge_text}
              </div>
            )}

            <h1 className={`font-bold tracking-tight text-gray-900 mb-6 ${isHome ? "text-5xl md:text-7xl leading-tight" : "text-4xl md:text-5xl"}`}>
              {renderHeading()}
            </h1>

            <p className={`text-lg md:text-xl text-gray-600 mb-10 ${isHome ? "mx-auto max-w-2xl" : "max-w-xl"}`}>
              {subheading}
            </p>

            {(cta_primary_label || cta_secondary_label) && (
              <div className={`flex flex-wrap gap-4 ${isHome ? "justify-center" : ""}`}>
                {cta_primary_label && cta_primary_url && (
                  <Link
                    to={cta_primary_url}
                    className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all group"
                  >
                    {cta_primary_label}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                {cta_secondary_label && cta_secondary_url && (
                  <Link
                    to={cta_secondary_url}
                    className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all group"
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
