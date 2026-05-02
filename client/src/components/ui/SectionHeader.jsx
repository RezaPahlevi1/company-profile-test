import { motion } from "framer-motion";

export default function SectionHeader({
  label,
  title,
  subtitle,
  centered = true,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`${centered ? "text-center" : ""} ${className}`}
    >
      {label && (
        <span className="inline-block text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">
          {label}
        </span>
      )}
      <h2 className="section-title">{title}</h2>
      {subtitle && (
        <p className={`section-subtitle ${centered ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
