import { useState } from "react";

import HeroEditor from "./editors/shared/HeroEditor";
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
        {/* Native color picker */}
        <input
          type="color"
          value={isValidHex ? safeValue : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 p-0.5 border border-gray-300 rounded-md cursor-pointer shadow-sm shrink-0"
        />
        {/* ✅ Hex text input — bisa paste hex langsung */}
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

// ✅ Reusable gradient editor — dipakai untuk section dan card
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

  const design = block.design || {};
  const bgType = design.bgType || "none";
  const isCta = block.type === "cta";
  const cardBgType = design.cardBgType || "default";

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
                    // strip prefix kosong → nama asli
                    const realField = field.replace(/^G/, "g");
                    handleDesignChange(realField, value);
                  }}
                />
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
        </div>
      )}
    </div>
  );
}
