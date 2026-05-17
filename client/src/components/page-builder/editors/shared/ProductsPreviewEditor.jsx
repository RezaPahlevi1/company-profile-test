import React from "react";

export default function ProductsPreviewEditor({ content, onChange }) {
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
          placeholder="Contoh: Produk Kami"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
        <input
          type="text"
          value={content.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Jelajahi Solusi Terbaik Kami"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
        <textarea
          value={content.subtitle || ""}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          rows={2}
          placeholder="Deskripsi singkat tentang produk..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Item Ditampilkan</label>
        <input
          type="number"
          min="1"
          max="12"
          value={content.count || 3}
          onChange={(e) => handleChange("count", parseInt(e.target.value) || 3)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Berapa banyak produk terbaru yang ingin ditampilkan (maksimal 12).</p>
      </div>
    </div>
  );
}
