import React, { useState } from "react";

// Shared editors
import HeroEditor from "./editors/shared/HeroEditor";
import CtaEditor from "./editors/shared/CtaEditor";
import RichTextEditor from "./editors/shared/RichTextEditor";
import ImageTextEditor from "./editors/shared/ImageTextEditor";
import IconGridEditor from "./editors/shared/IconGridEditor";
import ProductsPreviewEditor from "./editors/shared/ProductsPreviewEditor";
import ServicesPreviewEditor from "./editors/shared/ServicesPreviewEditor";
import BlogPreviewEditor from "./editors/shared/BlogPreviewEditor";

// Home-specific editors
import StatsEditor from "./editors/home/StatsEditor";
import AboutSnippetEditor from "./editors/home/AboutSnippetEditor";

// About-specific editors
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

// Label yang tampil di panel editor
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

// Props:
// block       — block yang sedang diedit (seluruh objek block termasuk konten dan desain)
// onChange    — callback (updatedBlock) => void, dipanggil setiap perubahan
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
      design: {
        ...(block.design || {}),
        [field]: value
      }
    });
  };

  const design = block.design || {};
  const bgType = design.bgType || "none";

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "content"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("content")}
        >
          Konten
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "design"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("design")}
        >
          Desain & Latar
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "content" ? (
        <Editor content={block.content || {}} onChange={handleContentChange} />
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Latar Belakang</label>
            <select
              value={bgType}
              onChange={(e) => handleDesignChange("bgType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="none">Bawaan (Default)</option>
              <option value="color">Warna Solid</option>
              <option value="gradient">Gradien (Kustom)</option>
            </select>
          </div>

          {bgType === "color" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Warna</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={design.bgColor || "#ffffff"}
                  onChange={(e) => handleDesignChange("bgColor", e.target.value)}
                  className="h-10 w-20 p-1 border border-gray-300 rounded-md cursor-pointer shadow-sm"
                />
                <span className="text-sm font-mono text-gray-500 uppercase">{design.bgColor || "#ffffff"}</span>
              </div>
            </div>
          )}

          {bgType === "gradient" && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pengaturan Gradien</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Warna Mulai</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.gradientStart || "#3b82f6"}
                      onChange={(e) => handleDesignChange("gradientStart", e.target.value)}
                      className="h-8 w-12 p-0.5 border border-gray-300 rounded cursor-pointer shadow-sm"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{design.gradientStart || "#3b82f6"}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Warna Akhir</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={design.gradientEnd || "#9333ea"}
                      onChange={(e) => handleDesignChange("gradientEnd", e.target.value)}
                      className="h-8 w-12 p-0.5 border border-gray-300 rounded cursor-pointer shadow-sm"
                    />
                    <span className="text-xs font-mono text-gray-500 uppercase">{design.gradientEnd || "#9333ea"}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Arah Gradien</label>
                  <select
                    value={design.gradientDirection || "to right"}
                    onChange={(e) => handleDesignChange("gradientDirection", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="to right">Ke Kanan</option>
                    <option value="to left">Ke Kiri</option>
                    <option value="to bottom">Ke Bawah</option>
                    <option value="to top">Ke Atas</option>
                    <option value="to bottom right">Ke Kanan Bawah</option>
                  </select>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-500 mb-2">Preview</label>
                <div 
                  className="w-full h-16 rounded-md shadow-sm border border-gray-200"
                  style={{
                    background: `linear-gradient(${design.gradientDirection || "to right"}, ${design.gradientStart || "#3b82f6"}, ${design.gradientEnd || "#9333ea"})`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}