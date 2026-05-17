import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function StoryBlock({ content, isCustomBg }) {
  const {
    label,
    heading,
    body_1,
    body_2,
    checklist = [],
    cards = []
  } = content;

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {label && (
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 font-semibold text-sm uppercase tracking-widest rounded-full mb-4">
                {label}
              </span>
            )}
            
            {heading && (
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {heading}
              </h2>
            )}
            
            {body_1 && (
              <p className="text-gray-600 text-lg mt-6 leading-relaxed">
                {body_1}
              </p>
            )}
            
            {body_2 && (
              <p className="text-gray-600 text-lg mt-4 leading-relaxed">
                {body_2}
              </p>
            )}
            
            {checklist.length > 0 && (
              <ul className="mt-8 space-y-3">
                {checklist.map((item, i) => (
                  <motion.li
                    key={i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex items-center gap-3 text-gray-600"
                  >
                    <CheckCircle size={18} className="text-blue-600 shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>

          {cards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {cards.map((card, i) => {
                const Icon = LucideIcons[card.icon] || LucideIcons.Target;
                const colorTheme = card.color === "purple" ? "bg-purple-50 text-purple-600" :
                                   card.color === "amber" ? "bg-amber-50 text-amber-600" :
                                   card.color === "green" ? "bg-green-50 text-green-600" :
                                   card.color === "rose" ? "bg-rose-50 text-rose-600" :
                                   "bg-blue-50 text-blue-600";
                
                const cardBg = card.color === "purple" ? "bg-purple-50/50 border-purple-100" :
                               card.color === "amber" ? "bg-amber-50/50 border-amber-100" :
                               card.color === "green" ? "bg-green-50/50 border-green-100" :
                               card.color === "rose" ? "bg-rose-50/50 border-rose-100" :
                               "bg-blue-50/50 border-blue-100";

                return (
                  <motion.div
                    key={card.id || i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className={`${cardBg} rounded-2xl p-6 border transition-shadow hover:shadow-md`}
                  >
                    <div className={`inline-flex w-12 h-12 rounded-xl items-center justify-center mb-4 ${colorTheme} bg-white shadow-sm`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{card.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {card.desc}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
