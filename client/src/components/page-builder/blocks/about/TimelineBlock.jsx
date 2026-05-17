import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function TimelineBlock({ content, isCustomBg }) {
  const { label, title, subtitle, items = [] } = content || {};

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6 max-w-6xl">
        {(label || title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            {label && (
              // ✅ Ganti bg-blue-50/text-blue-600 → bg-brand-50/text-brand-600
              <span className="inline-block px-3 py-1 bg-brand-50 text-brand-600 font-semibold text-sm uppercase tracking-widest rounded-full mb-4">
                {label}
              </span>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
          </div>
        )}

        {items.length > 0 ? (
          <div className="relative mt-16">
            {/* Garis tengah desktop */}
            <div className="absolute left-1/2 -translate-x-0.5 top-0 bottom-0 w-0.5 bg-slate-200 hidden lg:block" />

            <div className="space-y-12">
              {items.map((item, i) => (
                <motion.div
                  key={item.id || i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div
                    className={`flex-1 ${
                      i % 2 === 0 ? "lg:text-right" : "lg:text-left"
                    }`}
                  >
                    <div
                      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 inline-block max-w-sm w-full ${
                        i % 2 === 0 ? "lg:ml-auto" : ""
                      }`}
                    >
                      {/* ✅ Ganti text-blue-600 → text-brand-600 */}
                      <span className="text-brand-600 font-bold text-lg">
                        {item.year}
                      </span>
                      <h3 className="font-bold text-gray-900 mt-1 text-xl">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* ✅ Ganti bg-blue-600 → bg-brand-600 */}
                  <div className="hidden lg:flex w-10 h-10 bg-brand-600 rounded-full items-center justify-center shrink-0 z-10 shadow-md">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>

                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-500">
              Belum ada milestone yang ditambahkan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
