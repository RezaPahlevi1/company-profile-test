import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function AboutSnippetBlock({ content, isCustomBg }) {
  const {
    label,
    heading,
    body,
    cta_label,
    cta_url
  } = content;

  return (
    <section className={`py-24 relative overflow-hidden ${isCustomBg ? "bg-transparent" : "bg-gradient-to-br from-blue-600 to-blue-800"}`}>
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
              <span className="inline-block text-blue-200 font-semibold text-sm uppercase tracking-widest mb-4">
                {label}
              </span>
            )}
            
            {heading && (
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {heading}
              </h2>
            )}
            
            {body && (
              <p className="text-blue-100 text-lg mt-6 leading-relaxed">
                {body}
              </p>
            )}
            
            {cta_label && cta_url && (
              <Link
                to={cta_url}
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl mt-8 hover:bg-blue-50 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
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
