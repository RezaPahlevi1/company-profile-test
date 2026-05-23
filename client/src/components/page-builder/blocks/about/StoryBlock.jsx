import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { getIcon } from "../../iconRegistry";
import { getColor } from "../../blockColors";

const BLOCK_TYPE = "story";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

// COLOR_THEME dan getColorTheme tidak diubah — cards ikut sistem warna existing
const COLOR_THEME = {
  brand: {
    icon: "bg-brand-50 text-brand-600",
    card: "bg-brand-50/50 border-brand-100",
  },
  purple: {
    icon: "bg-purple-50 text-purple-600",
    card: "bg-purple-50/50 border-purple-100",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    card: "bg-amber-50/50 border-amber-100",
  },
  green: {
    icon: "bg-green-50 text-green-600",
    card: "bg-green-50/50 border-green-100",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    card: "bg-rose-50/50 border-rose-100",
  },
};

const getColorTheme = (color) => COLOR_THEME[color] || COLOR_THEME.brand;

export default function StoryBlock({ content, isCustomBg, design }) {
  const {
    label,
    heading,
    body_1,
    body_2,
    checklist = [],
    cards = [],
  } = content || {};

  const c = (key) => getColor(design, key, BLOCK_TYPE);

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Kiri — teks */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {label && (
              <span
                style={{
                  backgroundColor: c("labelBg"),
                  color: c("labelText"),
                }}
                className="inline-block px-3 py-1 font-semibold text-sm uppercase tracking-widest rounded-full mb-4"
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
            {body_1 && (
              <p
                style={{ color: c("body") }}
                className="text-lg mt-6 leading-relaxed"
              >
                {body_1}
              </p>
            )}
            {body_2 && (
              <p
                style={{ color: c("body") }}
                className="text-lg mt-4 leading-relaxed"
              >
                {body_2}
              </p>
            )}
            {checklist.length > 0 && (
              <ul className="mt-8 space-y-3">
                {checklist.map((item, i) => (
                  <motion.li
                    key={item || i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle
                      size={18}
                      style={{ color: c("checklistIcon") }}
                      className="shrink-0"
                    />
                    <span style={{ color: c("checklistText") }}>{item}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>

          {/* Kanan — cards, ikut sistem COLOR_THEME existing */}
          {cards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {cards.map((card, i) => {
                const Icon = getIcon(card.icon);
                const theme = getColorTheme(card.color);

                return (
                  <motion.div
                    key={card.id || i}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className={`${theme.card} rounded-2xl p-6 border transition-shadow hover:shadow-md`}
                  >
                    <div
                      className={`inline-flex w-12 h-12 rounded-xl items-center justify-center mb-4 ${theme.icon} bg-white shadow-sm`}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">
                      {card.title}
                    </h3>
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
