import React from "react";

export default function CtaEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Heading</label>
        <textarea
          value={content.heading || ""}
          onChange={(e) => handleChange("heading", e.target.value)}
          rows={2}
          placeholder="Judul CTA..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subheading</label>
        <textarea
          value={content.subheading || ""}
          onChange={(e) => handleChange("subheading", e.target.value)}
          rows={3}
          placeholder="Deskripsi ajakan..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="col-span-2 font-medium text-sm text-gray-800">Primary CTA (Tombol Utama)</div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={content.cta_primary_label || ""}
            onChange={(e) => handleChange("cta_primary_label", e.target.value)}
            placeholder="Hubungi Kami"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <input
            type="text"
            value={content.cta_primary_url || ""}
            onChange={(e) => handleChange("cta_primary_url", e.target.value)}
            placeholder="/contact"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="col-span-2 font-medium text-sm text-gray-800">Secondary CTA (Tombol Kedua)</div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={content.cta_secondary_label || ""}
            onChange={(e) => handleChange("cta_secondary_label", e.target.value)}
            placeholder="Lihat Produk"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <input
            type="text"
            value={content.cta_secondary_url || ""}
            onChange={(e) => handleChange("cta_secondary_url", e.target.value)}
            placeholder="/products"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
