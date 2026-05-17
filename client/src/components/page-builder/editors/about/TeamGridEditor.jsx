import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { nanoid } from "nanoid";

export default function TeamGridEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  const addItem = () => {
    const newItem = {
      id: nanoid(),
      name: "Nama Lengkap",
      role: "Jabatan",
      initial: "NL",
      image_url: ""
    };
    handleChange("items", [...(content.items || []), newItem]);
  };

  const updateItem = (id, field, value) => {
    const newItems = (content.items || []).map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // Auto-generate initial when name changes
      if (field === "name") {
        const words = value.split(" ").filter(Boolean);
        if (words.length > 1) {
          updatedItem.initial = (words[0][0] + words[1][0]).toUpperCase();
        } else if (words.length === 1) {
          updatedItem.initial = words[0].substring(0, 2).toUpperCase();
        } else {
          updatedItem.initial = "NA";
        }
      }
      
      return updatedItem;
    });
    handleChange("items", newItems);
  };

  const removeItem = (id) => {
    handleChange("items", (content.items || []).filter(item => item.id !== id));
  };

  const moveItem = (index, direction) => {
    const items = [...(content.items || [])];
    if (direction === "up" && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      handleChange("items", items);
    } else if (direction === "down" && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      handleChange("items", items);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label (Badge)</label>
          <input
            type="text"
            value={content.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Contoh: Tim Kami"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
          <input
            type="text"
            value={content.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Orang-orang di Balik Layar"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={content.subtitle || ""}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            rows={2}
            placeholder="Tim profesional kami siap membantu..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">Anggota Tim</label>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Anggota
          </button>
        </div>

        <div className="space-y-4">
          {(content.items || []).map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white relative group flex gap-4">
              {/* Controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === (content.items || []).length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-600 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 mt-6">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-500 font-bold text-lg">{item.initial || "?"}</span>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-3 pr-10">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={item.name || ""}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Jabatan (Role)</label>
                  <input
                    type="text"
                    value={item.role || ""}
                    onChange={(e) => updateItem(item.id, "role", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Inisial Khusus (Otomatis jika kosong)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={item.initial || ""}
                    onChange={(e) => updateItem(item.id, "initial", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">URL Foto Profil (Opsional)</label>
                  <input
                    type="text"
                    value={item.image_url || ""}
                    onChange={(e) => updateItem(item.id, "image_url", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}

          {(!content.items || content.items.length === 0) && (
            <div className="text-center py-8 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              Belum ada anggota tim yang ditambahkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
