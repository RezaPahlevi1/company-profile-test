import { useState } from "react";
import { RotateCcw } from "lucide-react";

import HeroEditor, { HeroImageManager } from "./editors/shared/HeroEditor";
import CtaEditor from "./editors/shared/CtaEditor";
import RichTextEditor from "./editors/shared/RichTextEditor";
import ImageTextEditor from "./editors/shared/ImageTextEditor";
import IconGridEditor from "./editors/shared/IconGridEditor";
import ProductsPreviewEditor from "./editors/shared/ProductsPreviewEditor";
import ServicesPreviewEditor from "./editors/shared/ServicesPreviewEditor";
import BlogPreviewEditor from "./editors/shared/BlogPreviewEditor";
import StatsEditor from "./editors/home/StatsEditor";
import AboutSnippetEditor from "./editors/home/AboutSnippetEditor";
import TimelineEditor from "./editors/about/TimelineEditor";
import TeamGridEditor from "./editors/about/TeamGridEditor";
import StoryEditor from "./editors/about/StoryEditor";

import { BLOCK_COLOR_DEFAULTS, getDefaultColors } from "./blockColors";

const EDITOR_COMPONENTS = {
  hero: HeroEditor,
  cta: CtaEditor,
  rich_text: RichTextEditor,
  image_text: ImageTextEditor,
  icon_grid: IconGridEditor,
  products_preview: ProductsPreviewEditor,
  services_preview: ServicesPreviewEditor,
  blog_preview: BlogPreviewEditor,
  stats: StatsEditor,
  about_snippet: AboutSnippetEditor,
  timeline: TimelineEditor,
  team_grid: TeamGridEditor,
  story: StoryEditor,
};

export const BLOCK_LABELS = {
  hero: "Hero Section",
  cta: "Call to Action",
  rich_text: "Rich Text",
  image_text: "Gambar & Teks",
  icon_grid: "Icon Grid",
  products_preview: "Produk Preview",
  services_preview: "Layanan Preview",
  blog_preview: "Blog Preview",
  stats: "Statistik",
  about_snippet: "Tentang Singkat",
  timeline: "Timeline",
  team_grid: "Tim",
  story: "Cerita & Visi",
};

// ✅ Color picker dengan hex input sinkron dua arah
function ColorPickerField({ label, value, onChange, hint }) {
  const safeValue = value || "#ffffff";
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(safeValue);

  const handleHexInput = (raw) => {
    const val = raw.startsWith("#") ? raw : `#${raw}`;
    onChange(val);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={isValidHex ? safeValue : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 p-0.5 border border-gray-300 rounded-md cursor-pointer shadow-sm shrink-0"
        />
        <input
          type="text"
          value={safeValue}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder="#ffffff"
          maxLength={7}
          spellCheck={false}
          className="w-28 px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function GradientPreview({ start, end, direction }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-2">
        Preview
      </label>
      <div
        className="w-full h-12 rounded-md shadow-sm border border-gray-200"
        style={{
          background: `linear-gradient(${direction || "to right"}, ${start || "#3b82f6"}, ${end || "#9333ea"})`,
        }}
      />
    </div>
  );
}

function GradientEditor({ prefix, design, onDesignChange }) {
  const startKey = `${prefix}GradientStart`;
  const endKey = `${prefix}GradientEnd`;
  const dirKey = `${prefix}GradientDirection`;

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        <ColorPickerField
          label="Warna Mulai"
          value={design[startKey]}
          onChange={(v) => onDesignChange(startKey, v)}
        />
        <ColorPickerField
          label="Warna Akhir"
          value={design[endKey]}
          onChange={(v) => onDesignChange(endKey, v)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Arah Gradien
        </label>
        <select
          value={design[dirKey] || "to right"}
          onChange={(e) => onDesignChange(dirKey, e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="to right">Ke Kanan →</option>
          <option value="to left">Ke Kiri ←</option>
          <option value="to bottom">Ke Bawah ↓</option>
          <option value="to top">Ke Atas ↑</option>
          <option value="to bottom right">Ke Kanan Bawah ↘</option>
          <option value="to bottom left">Ke Kiri Bawah ↙</option>
        </select>
      </div>
      <GradientPreview
        start={design[startKey]}
        end={design[endKey]}
        direction={design[dirKey]}
      />
    </div>
  );
}

function ColorGroup({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function TextColorSection({ blockType, design, onDesignChange }) {
  const colors = design?.colors || {};
  const defaults = BLOCK_COLOR_DEFAULTS[blockType] || {};

  const setColor = (key, value) => {
    onDesignChange("colors", { ...colors, [key]: value });
  };

  const picker = (key, label) => (
    <ColorPickerField
      key={key}
      label={label}
      value={colors[key] ?? defaults[key] ?? "#000000"}
      onChange={(v) => setColor(key, v)}
    />
  );

  if (blockType === "hero") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("badgeText", "Teks Badge")}
          {picker("badgeBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Teks Utama">
          {picker("heading", "Heading")}
          {picker("subheading", "Subheading")}
        </ColorGroup>
        <ColorGroup title="Highlight Heading">
          {picker("headingHighlightFrom", "Warna Mulai")}
          {picker("headingHighlightTo", "Warna Akhir")}
        </ColorGroup>
        <ColorGroup title="Tombol Utama">
          {picker("primaryBtnBg", "Background")}
          {picker("primaryBtnText", "Teks")}
        </ColorGroup>
        <ColorGroup title="Tombol Kedua">
          {picker("secondaryBtnBg", "Background")}
          {picker("secondaryBtnText", "Teks")}
          {picker("secondaryBtnBorder", "Border")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "cta") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Teks Card">
          {picker("heading", "Heading")}
          {picker("subheading", "Subheading")}
        </ColorGroup>
        <ColorGroup title="Tombol Utama">
          {picker("primaryBtnBg", "Background")}
          {picker("primaryBtnText", "Teks")}
        </ColorGroup>
        <ColorGroup title="Tombol Kedua">
          {picker("secondaryBtnText", "Teks")}
          {picker("secondaryBtnBorder", "Border")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "rich_text") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Teks Konten">
          {picker("prose", "Teks Paragraf")}
          {picker("proseHeading", "Heading")}
          {picker("proseLink", "Link")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "image_text") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Teks">{picker("heading", "Heading")}</ColorGroup>
        <ColorGroup title="Konten HTML">
          {picker("prose", "Teks Paragraf")}
          {picker("proseHeading", "Heading Konten")}
          {picker("proseLink", "Link")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "icon_grid") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("labelText", "Teks Badge")}
          {picker("labelBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Header Section">
          {picker("title", "Judul")}
          {picker("subtitle", "Subjudul")}
        </ColorGroup>
        <ColorGroup title="Icon">
          {picker("iconColor", "Warna Icon")}
          {picker("iconBg", "Background Icon")}
        </ColorGroup>
        <ColorGroup title="Item">
          {picker("itemTitle", "Judul Item")}
          {picker("itemDesc", "Deskripsi Item")}
        </ColorGroup>
      </div>
    );
  }

  if (
    blockType === "products_preview" ||
    blockType === "services_preview" ||
    blockType === "blog_preview"
  ) {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("labelText", "Teks Badge")}
          {picker("labelBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Header Section">
          {picker("title", "Judul")}
          {picker("subtitle", "Subjudul")}
          {picker("linkText", 'Link "Lihat Semua"')}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "stats") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Icon">
          {picker("iconColor", "Warna Icon")}
          {picker("iconBg", "Background Icon")}
        </ColorGroup>
        <ColorGroup title="Teks">
          {picker("value", "Angka / Value")}
          {picker("label", "Label")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "about_snippet") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Teks">
          {picker("label", "Label")}
          {picker("heading", "Heading")}
          {picker("body", "Isi / Body")}
        </ColorGroup>
        <ColorGroup title="Tombol CTA">
          {picker("ctaBg", "Background")}
          {picker("ctaText", "Teks")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "timeline") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("labelText", "Teks Badge")}
          {picker("labelBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Header Section">
          {picker("title", "Judul")}
          {picker("subtitle", "Subjudul")}
        </ColorGroup>
        <ColorGroup title="Item Milestone">
          {picker("itemYear", "Tahun")}
          {picker("itemTitle", "Judul Item")}
          {picker("itemDesc", "Deskripsi Item")}
          {picker("dotBg", "Warna Titik Garis")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "team_grid") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("labelText", "Teks Badge")}
          {picker("labelBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Header Section">
          {picker("title", "Judul")}
          {picker("subtitle", "Subjudul")}
        </ColorGroup>
        <ColorGroup title="Anggota Tim">
          {picker("memberName", "Nama")}
          {picker("memberRole", "Jabatan")}
        </ColorGroup>
        <ColorGroup title="Avatar Placeholder">
          {picker("avatarFrom", "Gradient Mulai")}
          {picker("avatarTo", "Gradient Akhir")}
        </ColorGroup>
      </div>
    );
  }

  if (blockType === "story") {
    return (
      <div className="space-y-5">
        <ColorGroup title="Badge">
          {picker("labelText", "Teks Badge")}
          {picker("labelBg", "Background Badge")}
        </ColorGroup>
        <ColorGroup title="Teks Utama">
          {picker("heading", "Heading")}
          {picker("body", "Paragraf")}
        </ColorGroup>
        <ColorGroup title="Checklist">
          {picker("checklistIcon", "Warna Icon")}
          {picker("checklistText", "Teks")}
        </ColorGroup>
      </div>
    );
  }

  return null;
}

// ============================================================
// BLOCK EDITOR — main export
// ============================================================
export default function BlockEditor({ block, onChange }) {
  const [activeTab, setActiveTab] = useState("content");

  if (!block) return null;

  const Editor = EDITOR_COMPONENTS[block.type];

  if (!Editor) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Editor untuk block type "{block.type}" belum tersedia.
      </div>
    );
  }

  const handleContentChange = (updatedContent) => {
    onChange({ ...block, content: updatedContent });
  };

  const handleDesignChange = (field, value) => {
    onChange({
      ...block,
      design: { ...(block.design || {}), [field]: value },
    });
  };

  const handleResetColors = () => {
    const defaults = getDefaultColors(block.type);
    onChange({
      ...block,
      design: { ...(block.design || {}), colors: defaults },
    });
  };

  const design = block.design || {};
  const bgType = design.bgType || "none";
  const isCta = block.type === "cta";
  const isHero = block.type === "hero";
  const cardBgType = design.cardBgType || "default";
  const isImageBg = isHero && bgType === "image";

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {["content", "design"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab === "content" ? "Konten" : "Desain & Latar"}
          </button>
        ))}
      </div>

      {activeTab === "content" ? (
        <Editor content={block.content || {}} onChange={handleContentChange} />
      ) : (
        <div className="space-y-6">
          {/* ── Background Section ── */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {isCta ? "Background Section (Luar Card)" : "Background Section"}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Latar Belakang
                </label>
                <select
                  value={bgType}
                  onChange={(e) => handleDesignChange("bgType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="none">Bawaan (Default)</option>
                  <option value="color">Warna Solid</option>
                  <option value="gradient">Gradien</option>
                  {/* ✅ Opsi gambar hanya muncul untuk hero block */}
                  {isHero && <option value="image">Gambar / Slider</option>}
                </select>
              </div>

              {bgType === "color" && (
                <ColorPickerField
                  label="Pilih Warna"
                  value={design.bgColor}
                  onChange={(v) => handleDesignChange("bgColor", v)}
                />
              )}

              {bgType === "gradient" && (
                <GradientEditor
                  prefix=""
                  design={{
                    GradientStart: design.gradientStart,
                    GradientEnd: design.gradientEnd,
                    GradientDirection: design.gradientDirection,
                  }}
                  onDesignChange={(field, value) => {
                    const realField = field.replace(/^G/, "g");
                    handleDesignChange(realField, value);
                  }}
                />
              )}

              {/* ✅ Image slider controls — hanya hero + bgType image */}
              {isImageBg && (
                <div className="space-y-5">
                  {/* Upload gambar */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <HeroImageManager
                      content={block.content || {}}
                      onContentChange={handleContentChange}
                    />
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Overlay opacity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Kegelapan Overlay
                      </label>
                      <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {Math.round((design.overlayOpacity ?? 0.45) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={design.overlayOpacity ?? 0.45}
                      onChange={(e) =>
                        handleDesignChange(
                          "overlayOpacity",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Terang (0%)</span>
                      <span>Gelap (90%)</span>
                    </div>
                  </div>

                  <div className="h-px bg-gray-100" />

                  {/* Autoplay settings */}
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Pengaturan Autoplay
                    </p>

                    {/* Toggle autoplay */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Autoplay
                        </p>
                        <p className="text-xs text-gray-400">
                          Slide otomatis berpindah
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleDesignChange(
                            "sliderAutoplay",
                            !design.sliderAutoplay,
                          )
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          design.sliderAutoplay ? "bg-blue-600" : "bg-gray-200"
                        }`}
                        role="switch"
                        aria-checked={!!design.sliderAutoplay}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            design.sliderAutoplay
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Interval — hanya tampil jika autoplay aktif */}
                    {design.sliderAutoplay && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Interval Perpindahan
                          </label>
                          <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {design.sliderInterval ?? 5}s
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="15"
                          step="1"
                          value={design.sliderInterval ?? 5}
                          onChange={(e) =>
                            handleDesignChange(
                              "sliderInterval",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>2 detik</span>
                          <span>15 detik</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Card Color — hanya CTA ── */}
          {isCta && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Warna Card CTA
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Warna Card
                    </label>
                    <select
                      value={cardBgType}
                      onChange={(e) =>
                        handleDesignChange("cardBgType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="default">Bawaan (Gelap)</option>
                      <option value="color">Warna Solid</option>
                      <option value="gradient">Gradien</option>
                    </select>
                  </div>
                  {cardBgType === "color" && (
                    <ColorPickerField
                      label="Pilih Warna Card"
                      value={design.cardBgColor}
                      onChange={(v) => handleDesignChange("cardBgColor", v)}
                    />
                  )}
                  {cardBgType === "gradient" && (
                    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <ColorPickerField
                          label="Warna Mulai Card"
                          value={design.cardGradientStart}
                          onChange={(v) =>
                            handleDesignChange("cardGradientStart", v)
                          }
                        />
                        <ColorPickerField
                          label="Warna Akhir Card"
                          value={design.cardGradientEnd}
                          onChange={(v) =>
                            handleDesignChange("cardGradientEnd", v)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Arah Gradien Card
                        </label>
                        <select
                          value={
                            design.cardGradientDirection || "to bottom right"
                          }
                          onChange={(e) =>
                            handleDesignChange(
                              "cardGradientDirection",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="to right">Ke Kanan →</option>
                          <option value="to left">Ke Kiri ←</option>
                          <option value="to bottom">Ke Bawah ↓</option>
                          <option value="to top">Ke Atas ↑</option>
                          <option value="to bottom right">
                            Ke Kanan Bawah ↘
                          </option>
                          <option value="to bottom left">
                            Ke Kiri Bawah ↙
                          </option>
                        </select>
                      </div>
                      <GradientPreview
                        start={design.cardGradientStart}
                        end={design.cardGradientEnd}
                        direction={design.cardGradientDirection}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Warna Teks — disembunyikan saat bgType image ── */}
          {!isImageBg && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Warna Teks & Elemen
                  </p>
                  <button
                    onClick={handleResetColors}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw size={11} />
                    Reset Warna
                  </button>
                </div>
                <TextColorSection
                  blockType={block.type}
                  design={design}
                  onDesignChange={handleDesignChange}
                />
              </div>
            </>
          )}

          {/* ── Warna Teks saat image bg — tetap bisa diatur ── */}
          {isImageBg && (
            <>
              <div className="h-px bg-gray-100" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Warna Teks & Tombol
                  </p>
                  <button
                    onClick={handleResetColors}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw size={11} />
                    Reset Warna
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Sesuaikan warna teks agar kontras dengan gambar background.
                </p>
                <TextColorSection
                  blockType={block.type}
                  design={design}
                  onDesignChange={handleDesignChange}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
