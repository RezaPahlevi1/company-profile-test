import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function StatsBlock({ content, isCustomBg }) {
  const items = content?.items || [];

  if (!items.length) return null;

  return (
    <section
      className={`py-16 border-b border-slate-100 ${
        isCustomBg ? "bg-transparent" : "bg-white"
      }`}
    >
      <div className="container-base px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((stat, i) => {
            // ✅ Fallback ke HelpCircle jika icon tidak ditemukan
            const Icon = LucideIcons[stat.icon] || LucideIcons.HelpCircle;

            return (
              <motion.div
                key={stat.id || i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                {/* ✅ Ganti bg-blue-50/text-blue-600 → bg-brand-50/text-brand-600 */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 rounded-2xl mb-3">
                  <Icon size={22} className="text-brand-600" />
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
