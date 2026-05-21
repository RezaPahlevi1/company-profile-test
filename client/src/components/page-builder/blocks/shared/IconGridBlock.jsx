import { useState } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { getColor, hexWithOpacity } from "../../blockColors";

const BLOCK_TYPE = "icon_grid";

export default function IconGridBlock({ content, isCustomBg, design }) {
  const { label, title, subtitle, background = "white", items = [] } = content;
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  return (
    <section
      className={`py-20 ${
        isCustomBg
          ? "bg-transparent"
          : background === "slate"
            ? "bg-slate-50"
            : "bg-white"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          {label && (
            <div
              style={{
                backgroundColor: c("labelBg"),
                color: c("labelText"),
              }}
              className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase mb-4"
            >
              {label}
            </div>
          )}
          {title && (
            <h2
              style={{ color: c("title") }}
              className="text-3xl md:text-4xl font-bold mb-6"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{ color: c("subtitle") }} className="text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => {
              const Icon = LucideIcons[item.icon] || LucideIcons.HelpCircle;
              return (
                <IconGridItem
                  key={item.id || index}
                  item={item}
                  index={index}
                  Icon={Icon}
                  iconColor={c("iconColor")}
                  iconBg={c("iconBg")}
                  itemTitle={c("itemTitle")}
                  itemDesc={c("itemDesc")}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ✅ Item dipisah jadi komponen sendiri agar useState hover per-item tidak
// menyebabkan re-render seluruh grid
function IconGridItem({
  item,
  index,
  Icon,
  iconColor,
  iconBg,
  itemTitle,
  itemDesc,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
    >
      <div
        style={{
          backgroundColor: hovered ? iconColor : iconBg,
          color: hovered ? "#ffffff" : iconColor,
        }}
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 style={{ color: itemTitle }} className="text-xl font-bold mb-3">
        {item.title}
      </h3>
      <p style={{ color: itemDesc }} className="leading-relaxed">
        {item.description}
      </p>
    </motion.div>
  );
}
