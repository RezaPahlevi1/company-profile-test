import DOMPurify from "dompurify";

// ✅ Hook untuk otomatis tambah rel="noopener noreferrer" di semua link
// yang punya target="_blank" — mencegah tabnabbing attack
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    // ✅ Pastikan semua link eksternal aman
    if (node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
    // ✅ Blokir javascript: protocol di href
    const href = node.getAttribute("href") || "";
    if (/^javascript:/i.test(href.trim())) {
      node.removeAttribute("href");
    }
  }

  // ✅ Blokir data: URL di img src — bisa dipakai untuk exfiltrate data
  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") || "";
    if (/^data:/i.test(src.trim())) {
      node.removeAttribute("src");
    }
  }
});

const sanitizeHtml = (html) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    // ✅ Paksa return string bukan DOM node
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
};

export default sanitizeHtml;
