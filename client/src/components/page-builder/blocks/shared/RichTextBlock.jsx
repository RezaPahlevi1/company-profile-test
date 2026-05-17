import DOMPurify from "dompurify";

export default function RichTextBlock({ content, isCustomBg }) {
  const { html } = content || {};

  if (!html) return null;

  // ✅ Sanitasi HTML sebelum render — cegah XSS
  const clean = DOMPurify.sanitize(html);

  return (
    <section className={`py-16 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div
          className="max-w-4xl mx-auto prose prose-blue prose-lg md:prose-xl"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      </div>
    </section>
  );
}
