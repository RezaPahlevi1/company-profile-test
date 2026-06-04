import { useRef, useState } from "react";
import {
  ImagePlus,
  Trash2,
  Loader2,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import { uploadHeroImage, deleteHeroImage } from "../../../../api/pageBuilder";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_IMAGES = 10;

// ─── Sortable thumbnail item ────────────────────────────────
function SortableImageItem({ url, index, onDelete, isDeleting }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group w-24 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
    >
      <img
        src={url}
        alt={`Slide ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-0.5 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        aria-label="Geser urutan"
      >
        <GripVertical size={12} />
      </button>

      {/* Delete button */}
      <button
        onClick={() => onDelete(url)}
        disabled={isDeleting}
        className="absolute top-1 right-1 p-0.5 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 disabled:opacity-50"
        aria-label="Hapus gambar"
      >
        {isDeleting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Trash2 size={12} />
        )}
      </button>

      {/* Index badge */}
      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/40 text-white leading-none">
        {index + 1}
      </div>
    </div>
  );
}

// ─── Main HeroEditor ─────────────────────────────────────────
export default function HeroEditor({ content, onChange }) {
  const fileInputRef = useRef(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingUrl, setDeletingUrl] = useState(null);

  const bgImages = content.bg_images || [];

  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  // ─── Upload handler ──────────────────────────────────────
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - bgImages.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      e.target.value = "";
      return;
    }

    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast(
        `Hanya ${remaining} gambar yang akan diupload (batas maksimal ${MAX_IMAGES})`,
        {
          icon: "⚠️",
        },
      );
    }

    setUploadingCount(toUpload.length);

    const uploaded = [];
    let failCount = 0;

    for (const file of toUpload) {
      try {
        const res = await uploadHeroImage(file);
        uploaded.push(res.data.url);
      } catch (err) {
        failCount++;
        console.error("Upload failed:", err);
      } finally {
        setUploadingCount((prev) => Math.max(0, prev - 1));
      }
    }

    if (uploaded.length > 0) {
      handleChange("bg_images", [...bgImages, ...uploaded]);
      toast.success(
        uploaded.length === 1
          ? "Gambar berhasil diupload"
          : `${uploaded.length} gambar berhasil diupload`,
      );
    }
    if (failCount > 0) {
      toast.error(`${failCount} gambar gagal diupload`);
    }

    e.target.value = "";
  };

  // ─── Delete handler ──────────────────────────────────────
  const handleDelete = async (url) => {
    setDeletingUrl(url);
    try {
      await deleteHeroImage(url);
      handleChange(
        "bg_images",
        bgImages.filter((u) => u !== url),
      );
      toast.success("Gambar berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus gambar");
      console.error(err);
    } finally {
      setDeletingUrl(null);
    }
  };

  // ─── Drag reorder ────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = bgImages.indexOf(active.id);
    const newIndex = bgImages.indexOf(over.id);
    handleChange("bg_images", arrayMove(bgImages, oldIndex, newIndex));
  };

  const isUploading = uploadingCount > 0;
  const canAddMore = bgImages.length < MAX_IMAGES;

  return (
    <div className="space-y-6">
      {/* ── Variant & Badge ── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variant
          </label>
          <select
            value={content.variant || "page"}
            onChange={(e) => handleChange("variant", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="home">Home (Besar + Animasi)</option>
            <option value="page">Page (Kecil + Simple)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Badge Text
          </label>
          <input
            type="text"
            value={content.badge_text || ""}
            onChange={(e) => handleChange("badge_text", e.target.value)}
            placeholder="Contoh: Solusi Digital Terpercaya"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* ── Heading ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Heading
        </label>
        <textarea
          value={content.heading || ""}
          onChange={(e) => handleChange("heading", e.target.value)}
          rows={2}
          placeholder="Judul utama di hero..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* ── Heading Highlight ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Heading Highlight
        </label>
        <input
          type="text"
          value={content.heading_highlight || ""}
          onChange={(e) => handleChange("heading_highlight", e.target.value)}
          placeholder="Kata yang di-highlight (harus ada di Heading)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Kata ini akan diberi warna gradasi.
        </p>
      </div>

      {/* ── Subheading ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subheading
        </label>
        <textarea
          value={content.subheading || ""}
          onChange={(e) => handleChange("subheading", e.target.value)}
          rows={3}
          placeholder="Deskripsi di bawah judul..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* ── Primary CTA ── */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="col-span-2 font-medium text-sm text-gray-800">
          Primary CTA (Tombol Utama)
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={content.cta_primary_label || ""}
            onChange={(e) => handleChange("cta_primary_label", e.target.value)}
            placeholder="Lihat Produk"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="text"
            value={content.cta_primary_url || ""}
            onChange={(e) => handleChange("cta_primary_url", e.target.value)}
            placeholder="/products"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* ── Secondary CTA ── */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div className="col-span-2 font-medium text-sm text-gray-800">
          Secondary CTA (Tombol Kedua)
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={content.cta_secondary_label || ""}
            onChange={(e) =>
              handleChange("cta_secondary_label", e.target.value)
            }
            placeholder="Hubungi Kami"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="text"
            value={content.cta_secondary_url || ""}
            onChange={(e) => handleChange("cta_secondary_url", e.target.value)}
            placeholder="/contact"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* ── Gambar Slider (info saja, UI upload ada di tab Desain) ── */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <AlertCircle size={15} className="text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600">
          Untuk mengatur background gambar/slider, buka tab{" "}
          <strong>Desain &amp; Latar</strong> dan pilih tipe latar{" "}
          <strong>Gambar</strong>.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HeroImageManager — dirender dari BlockEditor di tab Desain
// Export terpisah agar BlockEditor bisa import langsung
// ─────────────────────────────────────────────────────────────
export function HeroImageManager({ content, onContentChange }) {
  const fileInputRef = useRef(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingUrl, setDeletingUrl] = useState(null);

  const bgImages = content?.bg_images || [];

  const updateImages = (newImages) => {
    onContentChange({ ...content, bg_images: newImages });
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - bgImages.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_IMAGES} gambar`);
      e.target.value = "";
      return;
    }

    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast(`Hanya ${remaining} gambar lagi yang bisa ditambahkan`, {
        icon: "⚠️",
      });
    }

    setUploadingCount(toUpload.length);
    const uploaded = [];
    let failCount = 0;

    for (const file of toUpload) {
      try {
        const res = await uploadHeroImage(file);
        uploaded.push(res.data.url);
      } catch (err) {
        failCount++;
        console.error("Upload failed:", err);
      } finally {
        setUploadingCount((prev) => Math.max(0, prev - 1));
      }
    }

    if (uploaded.length > 0) {
      updateImages([...bgImages, ...uploaded]);
      toast.success(
        uploaded.length === 1
          ? "Gambar berhasil diupload"
          : `${uploaded.length} gambar berhasil diupload`,
      );
    }
    if (failCount > 0) {
      toast.error(`${failCount} gambar gagal diupload`);
    }

    e.target.value = "";
  };

  const handleDelete = async (url) => {
    setDeletingUrl(url);
    try {
      await deleteHeroImage(url);
      updateImages(bgImages.filter((u) => u !== url));
      toast.success("Gambar berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus gambar");
    } finally {
      setDeletingUrl(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = bgImages.indexOf(active.id);
    const newIndex = bgImages.indexOf(over.id);
    updateImages(arrayMove(bgImages, oldIndex, newIndex));
  };

  const isUploading = uploadingCount > 0;
  const canAddMore = bgImages.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Gambar Slider
        </p>
        <span className="text-xs text-gray-400">
          {bgImages.length}/{MAX_IMAGES} gambar
        </span>
      </div>

      {/* Thumbnail list */}
      {bgImages.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={bgImages}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-2 flex-wrap">
              {bgImages.map((url, i) => (
                <SortableImageItem
                  key={url}
                  url={url}
                  index={i}
                  onDelete={handleDelete}
                  isDeleting={deletingUrl === url}
                />
              ))}

              {/* Upload skeleton saat uploading */}
              {isUploading &&
                Array.from({ length: uploadingCount }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="w-24 h-20 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 flex items-center justify-center"
                  >
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload area */}
      {canAddMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Mengupload {uploadingCount} gambar...
              </>
            ) : (
              <>
                <ImagePlus size={15} />
                Tambah Gambar ({bgImages.length}/{MAX_IMAGES})
              </>
            )}
          </button>
        </>
      )}

      {bgImages.length === 0 && !isUploading && (
        <p className="text-xs text-gray-400 text-center py-1">
          Belum ada gambar. Upload minimal 1 gambar untuk mengaktifkan slider.
        </p>
      )}

      {bgImages.length > 1 && (
        <p className="text-xs text-gray-400">
          Drag thumbnail untuk mengubah urutan slide.
        </p>
      )}
    </div>
  );
}
