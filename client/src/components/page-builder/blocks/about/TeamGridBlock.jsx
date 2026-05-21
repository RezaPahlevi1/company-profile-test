import { motion } from "framer-motion";
import { getColor } from "../../blockColors";

const BLOCK_TYPE = "team_grid";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function TeamGridBlock({ content, isCustomBg, design }) {
  const { label, title, subtitle, items = [] } = content || {};
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  return (
    <section
      className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-slate-50"}`}
    >
      <div className="container mx-auto px-6 max-w-6xl">
        {(label || title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-16">
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
            {title && (
              <h2
                style={{ color: c("title") }}
                className="text-3xl md:text-4xl font-bold mb-4"
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
        )}

        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((member, i) => (
              <motion.div
                key={member.id || i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
              >
                {member.image_url ? (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-20 h-20 object-cover rounded-2xl mx-auto mb-4 border border-gray-100"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    style={{
                      background: `linear-gradient(to bottom right, ${c("avatarFrom")}, ${c("avatarTo")})`,
                    }}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"
                  >
                    <span className="text-white font-bold text-2xl">
                      {member.initial || "?"}
                    </span>
                  </div>
                )}
                <h3
                  style={{ color: c("memberName") }}
                  className="font-bold text-lg"
                >
                  {member.name}
                </h3>
                <p
                  style={{ color: c("memberRole") }}
                  className="text-sm mt-1 font-medium"
                >
                  {member.role}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">
              Belum ada anggota tim yang ditambahkan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
