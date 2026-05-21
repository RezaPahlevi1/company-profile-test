import { getColor } from "../../blockColors";
import sanitizeHtml from "../../../../utils/sanitizeHtml";

const BLOCK_TYPE = "rich_text";

export default function RichTextBlock({ content, isCustomBg, design }) {
  const { html } = content || {};
  if (!html) return null;

  const clean = sanitizeHtml(html);
  const c = (key) => getColor(design, key, BLOCK_TYPE);

  return (
    <section className={`py-16 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div
          style={{
            "--prose-color": c("prose"),
            "--prose-heading-color": c("proseHeading"),
            "--prose-link-color": c("proseLink"),
          }}
          className="max-w-4xl mx-auto prose prose-blue prose-lg md:prose-xl
            [&_p]:text-[var(--prose-color)]
            [&_li]:text-[var(--prose-color)]
            [&_blockquote]:text-[var(--prose-color)]
            [&_h2]:text-[var(--prose-heading-color)]
            [&_h3]:text-[var(--prose-heading-color)]
            [&_h4]:text-[var(--prose-heading-color)]
            [&_a]:text-[var(--prose-link-color)]"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      </div>
    </section>
  );
}
