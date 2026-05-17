import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { nanoid } from "nanoid";

const COMMON_ICONS = [
  "Target", "Eye", "Award", "Users", "Lightbulb", 
  "Shield", "TrendingUp", "Zap", "Heart", "Briefcase"
];

const COLORS = [
  { value: "brand", label: "Biru (Brand)" },
  { value: "purple", label: "Ungu" },
  { value: "amber", label: "Kuning" },
  { value: "green", label: "Hijau" },
  { value: "rose", label: "Merah" }
];

export default function StoryEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  // Checklist handlers
  const addChecklistItem = () => {
    handleChange("checklist", [...(content.checklist || []), "Point baru"]);
  };

  const updateChecklistItem = (index, value) => {
    const newList = [...(content.checklist || [])];
    newList[index] = value;
    handleChange("checklist", newList);
  };

  const removeChecklistItem = (index) => {
    handleChange("checklist", (content.checklist || []).filter((_, i) => i !== index));
  };

  // Cards handlers
  const addCard = () => {
    const newCard = {
      id: nanoid(),
      icon: "Target",
      title: "Judul Card",
      desc: "Deskripsi singkat card...",
      color: "brand"
    };
    handleChange("cards", [...(content.cards || []), newCard]);
  };

  const updateCard = (id, field, value) => {
    const newCards = (content.cards || []).map(card => 
      card.id === id ? { ...card, [field]: value } : card
    );
    handleChange("cards", newCards);
  };

  const removeCard = (id) => {
    handleChange("cards", (content.cards || []).filter(c => c.id !== id));
  };

  const moveCard = (index, direction) => {
    const cards = [...(content.cards || [])];
    if (direction === "up" && index > 0) {
      [cards[index - 1], cards[index]] = [cards[index], cards[index - 1]];
      handleChange("cards", cards);
    } else if (direction === "down" && index < cards.length - 1) {
      [cards[index + 1], cards[index]] = [cards[index], cards[index + 1]];
      handleChange("cards", cards);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Text Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label (Badge)</label>
          <input
            type="text"
            value={content.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Contoh: Cerita Kami"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Utama</label>
          <input
            type="text"
            value={content.heading || ""}
            onChange={(e) => handleChange("heading", e.target.value)}
            placeholder="Membantu Bisnis Anda Bertransformasi..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paragraf 1</label>
          <textarea
            value={content.body_1 || ""}
            onChange={(e) => handleChange("body_1", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paragraf 2 (Opsional)</label>
          <textarea
            value={content.body_2 || ""}
            onChange={(e) => handleChange("body_2", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Checklist Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Daftar Poin (Checklist)</label>
          <button
            type="button"
            onClick={addChecklistItem}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="w-3 h-3 mr-1" /> Tambah
          </button>
        </div>
        
        <div className="space-y-2">
          {(content.checklist || []).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateChecklistItem(index, e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(index)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(!content.checklist || content.checklist.length === 0) && (
            <p className="text-xs text-gray-500 italic">Tidak ada poin checklist.</p>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Cards (Visi, Misi, dll)</label>
          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Card
          </button>
        </div>

        <div className="space-y-3">
          {(content.cards || []).map((card, index) => (
            <div key={card.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group">
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveCard(index, "up")}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(index, "down")}
                  disabled={index === (content.cards || []).length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeCard(card.id)}
                  className="p-1 text-gray-400 hover:text-red-600 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pr-12">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Judul</label>
                  <input
                    type="text"
                    value={card.title || ""}
                    onChange={(e) => updateCard(card.id, "title", e.target.value)}
                    placeholder="Contoh: Misi"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Deskripsi</label>
                  <textarea
                    value={card.desc || ""}
                    onChange={(e) => updateCard(card.id, "desc", e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
                  <select
                    value={card.icon || "Target"}
                    onChange={(e) => updateCard(card.id, "icon", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {COMMON_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Warna Tema</label>
                  <select
                    value={card.color || "brand"}
                    onChange={(e) => updateCard(card.id, "color", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {COLORS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {(!content.cards || content.cards.length === 0) && (
            <div className="text-center py-6 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              Belum ada card ditambahkan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
