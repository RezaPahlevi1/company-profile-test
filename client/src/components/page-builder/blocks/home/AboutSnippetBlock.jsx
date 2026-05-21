import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getColor, hexWithOpacity } from "../../blockColors";

const BLOCK_TYPE = "about_snippet";

export default function AboutSnippetBlock({ content, isCustomBg, design }) {
  const { label, heading, body, cta_label, cta_url } = content;
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  const [ctaHovered, setCtaHovered] = useState(false);
  const ctaBg = c("ctaBg");

  return (
    <section
      className={`py-24 relative overflow-hidden ${
        isCustomBg
          ? "bg-transparent"
          : "bg-gradient-to-br from-blue-600 to-blue-800"
      }`}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "30px 30px",
        }}
      />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {label && (
              <span
                style={{ color: c("label") }}
                className="inline-block font-semibold text-sm uppercase tracking-widest mb-4"
              >
                {label}
              </span>
            )}
            {heading && (
              <h2
                style={{ color: c("heading") }}
                className="text-3xl sm:text-4xl font-bold leading-tight"
              >
                {heading}
              </h2>
            )}
            {body && (
              <p
                style={{ color: c("body") }}
                className="text-lg mt-6 leading-relaxed"
              >
                {body}
              </p>
            )}
            {cta_label && cta_url && (
              <Link
                to={cta_url}
                style={{
                  backgroundColor: ctaHovered
                    ? hexWithOpacity(ctaBg, 0.9)
                    : ctaBg,
                  color: c("ctaText"),
                }}
                className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl mt-8 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
              >
                {cta_label}
                <ArrowRight size={18} />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
