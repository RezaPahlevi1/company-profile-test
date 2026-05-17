import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { nanoid } from "nanoid";

const COMMON_ICONS = [
  "Users", "TrendingUp", "Zap", "Shield", "Star", 
  "Heart", "Award", "Briefcase", "CheckCircle", "Globe"
];

export default function StatsEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  const handleItemChange = (id, field, value) => {
    const newItems = (content.items || []).map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    handleChange("items", newItems);
  };

  const addItem = () => {
    const newItem = {
      id: nanoid(),
      icon: "Users",
      value: "100+",
      label: "Label Baru"
    };
    handleChange("items", [...(content.items || []), newItem]);
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Statistik Items</label>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Item
          </button>
        </div>

        <div className="space-y-3">
          {(content.items || []).map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white relative group">
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

              <div className="grid grid-cols-2 gap-3 pr-12">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nilai (Value)</label>
                  <input
                    type="text"
                    value={item.value || ""}
                    onChange={(e) => handleItemChange(item.id, "value", e.target.value)}
                    placeholder="Contoh: 50+"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={item.label || ""}
                    onChange={(e) => handleItemChange(item.id, "label", e.target.value)}
                    placeholder="Contoh: Klien Puas"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pilih Icon</label>
                  <select
                    value={item.icon || "Users"}
                    onChange={(e) => handleItemChange(item.id, "icon", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {COMMON_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          
          {(!content.items || content.items.length === 0) && (
            <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              Belum ada statistik ditambahkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
