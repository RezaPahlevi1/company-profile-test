import React from "react";

export default function AboutSnippetEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label (Badge)</label>
        <input
          type="text"
          value={content.label || ""}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="Contoh: Tentang Kami"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
        <input
          type="text"
          value={content.heading || ""}
          onChange={(e) => handleChange("heading", e.target.value)}
          placeholder="Kami Berkomitmen..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Paragraf Teks</label>
        <textarea
          value={content.body || ""}
          onChange={(e) => handleChange("body", e.target.value)}
          rows={4}
          placeholder="Teks deskripsi..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="col-span-2 font-medium text-sm text-gray-800">Tombol (Call to Action)</div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={content.cta_label || ""}
            onChange={(e) => handleChange("cta_label", e.target.value)}
            placeholder="Pelajari Lebih Lanjut"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
          <input
            type="text"
            value={content.cta_url || ""}
            onChange={(e) => handleChange("cta_url", e.target.value)}
            placeholder="/about"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
