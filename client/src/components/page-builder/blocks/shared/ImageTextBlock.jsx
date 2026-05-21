import { motion } from "framer-motion";
import { getColor } from "../../blockColors";
import sanitizeHtml from "../../../../utils/sanitizeHtml";

const BLOCK_TYPE = "image_text";

export default function ImageTextBlock({ content, isCustomBg, design }) {
  const { image_url, image_position = "left", heading, body } = content || {};

  const cleanBody = body ? sanitizeHtml(body) : "";
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  return (
    <section className={`py-20 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div
          className={`flex flex-col md:flex-row items-center gap-12 lg:gap-20 ${
            image_position === "right" ? "md:flex-row-reverse" : ""
          }`}
        >
          {/* Gambar */}
          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: image_position === "left" ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] bg-gray-100"
            >
              {image_url ? (
                <img
                  src={image_url}
                  alt={heading || "Section image"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Belum ada gambar
                </div>
              )}
            </motion.div>
          </div>

          {/* Teks */}
          <div className="w-full md:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: image_position === "left" ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {heading && (
                <h2
                  style={{ color: c("heading") }}
                  className="text-3xl md:text-4xl font-bold mb-6 leading-tight"
                >
                  {heading}
                </h2>
              )}
              {cleanBody && (
                <div
                  style={{
                    "--prose-color": c("prose"),
                    "--prose-heading-color": c("proseHeading"),
                    "--prose-link-color": c("proseLink"),
                  }}
                  className="prose prose-blue prose-lg max-w-none
                    [&_p]:text-[var(--prose-color)]
                    [&_li]:text-[var(--prose-color)]
                    [&_h2]:text-[var(--prose-heading-color)]
                    [&_h3]:text-[var(--prose-heading-color)]
                    [&_a]:text-[var(--prose-link-color)]"
                  dangerouslySetInnerHTML={{ __html: cleanBody }}
                />
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
