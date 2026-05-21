// ============================================================
// DEFAULT COLORS — warna hardcoded di setiap block dijadikan default
// Key harus konsisten dengan yang dibaca di block components
// ============================================================

export const BLOCK_COLOR_DEFAULTS = {
  hero: {
    badgeText: "#2563eb",
    badgeBg: "#eff6ff",
    heading: "#111827",
    headingHighlightFrom: "#2563eb",
    headingHighlightTo: "#4f46e5",
    subheading: "#4b5563",
    primaryBtnBg: "#2563eb",
    primaryBtnText: "#ffffff",
    secondaryBtnBg: "#ffffff",
    secondaryBtnText: "#374151",
    secondaryBtnBorder: "#e5e7eb",
  },
  cta: {
    heading: "#ffffff",
    subheading: "#ffffff",
    primaryBtnBg: "#ffffff",
    primaryBtnText: "#1d4ed8",
    secondaryBtnText: "#ffffff",
    secondaryBtnBorder: "#ffffff",
  },
  rich_text: {
    prose: "#374151",
    proseHeading: "#111827",
    proseLink: "#2563eb",
  },
  image_text: {
    heading: "#111827",
    prose: "#4b5563",
    proseHeading: "#111827",
    proseLink: "#2563eb",
  },
  icon_grid: {
    labelText: "#2563eb",
    labelBg: "#eff6ff",
    title: "#111827",
    subtitle: "#4b5563",
    itemTitle: "#111827",
    itemDesc: "#4b5563",
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
  },
  products_preview: {
    labelText: "#1d4ed8",
    labelBg: "#dbeafe",
    title: "#111827",
    subtitle: "#4b5563",
    linkText: "#2563eb",
  },
  services_preview: {
    labelText: "#1d4ed8",
    labelBg: "#dbeafe",
    title: "#111827",
    subtitle: "#4b5563",
    linkText: "#2563eb",
  },
  blog_preview: {
    labelText: "#1d4ed8",
    labelBg: "#dbeafe",
    title: "#111827",
    subtitle: "#4b5563",
    linkText: "#2563eb",
  },
  stats: {
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
    value: "#0f172a",
    label: "#64748b",
  },
  about_snippet: {
    label: "#bfdbfe",
    heading: "#ffffff",
    body: "#bfdbfe",
    ctaBg: "#ffffff",
    ctaText: "#2563eb",
  },
  timeline: {
    labelText: "#2563eb",
    labelBg: "#eff6ff",
    title: "#111827",
    subtitle: "#4b5563",
    itemYear: "#2563eb",
    itemTitle: "#111827",
    itemDesc: "#6b7280",
    dotBg: "#2563eb",
  },
  team_grid: {
    labelText: "#2563eb",
    labelBg: "#eff6ff",
    title: "#111827",
    subtitle: "#4b5563",
    memberName: "#111827",
    memberRole: "#2563eb",
    avatarFrom: "#60a5fa",
    avatarTo: "#2563eb",
  },
  story: {
    labelText: "#2563eb",
    labelBg: "#eff6ff",
    heading: "#111827",
    body: "#4b5563",
    checklistText: "#4b5563",
    checklistIcon: "#2563eb",
  },
};

// ============================================================
// HELPER — ambil satu warna dengan fallback ke default
// Dipakai di setiap block component
// ============================================================
export const getColor = (design, key, blockType) => {
  return (
    design?.colors?.[key] ?? BLOCK_COLOR_DEFAULTS[blockType]?.[key] ?? "#000000"
  );
};

// ============================================================
// HELPER — hex + opacity untuk hover effect
// opacity: 0.0 - 1.0
// Contoh: hexWithOpacity("#2563eb", 0.1) → "#2563eb1a"
// ============================================================
export const hexWithOpacity = (hex, opacity) => {
  const clean = hex.replace("#", "");
  // handle shorthand hex #abc → #aabbcc
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${full}${alpha}`;
};

// ============================================================
// HELPER — reset semua warna ke default untuk satu block type
// Dipakai di BlockEditor tombol "Reset Warna"
// ============================================================
export const getDefaultColors = (blockType) => {
  return BLOCK_COLOR_DEFAULTS[blockType] ?? {};
};
