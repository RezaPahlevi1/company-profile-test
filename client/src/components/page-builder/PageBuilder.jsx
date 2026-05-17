import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Undo2,
  Redo2,
  Save,
  X,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { getPageConfig, updatePageConfig } from "../../api/pageBuilder";
import BlockEditor, { BLOCK_LABELS } from "./BlockEditor";
import BlockLibrary from "./BlockLibrary";

function SortableBlockItem({
  block,
  isSelected,
  onSelect,
  onToggleVisible,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block.id)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border transition-colors ${
        isSelected
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-100 hover:bg-gray-50"
      } ${!block.visible ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical size={16} />
      </button>

      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
        {BLOCK_LABELS[block.type] || block.type}
      </span>

      <div
        className="flex items-center gap-1 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onToggleVisible(block.id)}
          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
          title={block.visible ? "Sembunyikan" : "Tampilkan"}
        >
          {block.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
          title="Hapus block"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isSelected && (
        <ChevronRight size={14} className="text-blue-500 shrink-0" />
      )}
    </div>
  );
}

export default function PageBuilder({ pageKey, pageLabel }) {
  const queryClient = useQueryClient();

  const [history, setHistory] = useState([[]]);
  const [cursor, setCursor] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ✅ cursorRef — selalu sinkron dengan cursor terbaru
  // Dipakai di dalam pushHistory agar tidak ada race condition dari closure lama
  const cursorRef = useRef(cursor);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const blocks = history[cursor];

  const { data, isLoading } = useQuery({
    queryKey: ["page-config", pageKey],
    queryFn: () => getPageConfig(pageKey),
    staleTime: 0,
  });

  useEffect(() => {
    if (data && !initialized) {
      const serverBlocks = data?.data?.data?.blocks || [];
      setHistory([serverBlocks]);
      setCursor(0);
      setInitialized(true);
    }
  }, [data, initialized]);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => updatePageConfig(pageKey, blocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-config", pageKey] });
      queryClient.invalidateQueries({
        queryKey: [`public-page-config-${pageKey}`],
      });
      toast.success("Halaman berhasil disimpan");
      setHasUnsaved(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal menyimpan");
    },
  });

  // ✅ Fix race condition — pakai cursorRef bukan cursor dari closure
  const pushHistory = useCallback((newBlocks) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, cursorRef.current + 1);
      return [...sliced, newBlocks];
    });
    setCursor((prev) => prev + 1);
    setHasUnsaved(true);
  }, []); // ← deps kosong karena pakai ref, bukan closure

  const undo = useCallback(() => {
    if (cursorRef.current > 0) {
      setCursor((c) => c - 1);
      setHasUnsaved(true);
    }
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (cursorRef.current < prev.length - 1) {
        setCursor((c) => c + 1);
        setHasUnsaved(true);
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    pushHistory(arrayMove(blocks, oldIndex, newIndex));
  };

  const handleToggleVisible = (blockId) => {
    pushHistory(
      blocks.map((b) => (b.id === blockId ? { ...b, visible: !b.visible } : b)),
    );
  };

  const handleDelete = (blockId) => {
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    pushHistory(blocks.filter((b) => b.id !== blockId));
  };

  // ✅ Terima full block object dari BlockEditor (content + design)
  // Update in-place agar tidak flooding history saat mengetik
  const handleBlockChange = useCallback(
    (updatedBlock) => {
      setHistory((prev) => {
        const updated = prev.map((snapshot, i) =>
          i === cursorRef.current
            ? snapshot.map((b) => (b.id === selectedBlockId ? updatedBlock : b))
            : snapshot,
        );
        return updated;
      });
      setHasUnsaved(true);
    },
    [selectedBlockId],
  );

  // ✅ Push ke history saat blur — supaya perubahan teks bisa di-undo
  const handleContentBlur = useCallback(() => {
    if (!selectedBlockId) return;
    pushHistory([...blocks]);
  }, [selectedBlockId, blocks, pushHistory]);

  const handleAddBlock = (newBlock) => {
    pushHistory([...blocks, newBlock]);
    setShowLibrary(false);
    setSelectedBlockId(newBlock.id);
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  if (isLoading || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {pageLabel} Builder
            </h1>
            {hasUnsaved && (
              <p className="text-xs text-amber-500 mt-0.5">
                Ada perubahan yang belum disimpan
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={cursor === 0}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={redo}
              disabled={cursor >= history.length - 1}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={15} />
            </button>
            <a
              href={pageKey === "home" ? "/" : `/${pageKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              <Eye size={14} />
              Preview
            </a>
            <button
              onClick={() => save()}
              disabled={isSaving || !hasUnsaved}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2 rounded-lg transition-colors"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span className="hidden sm:inline">
                {isSaving ? "Menyimpan..." : "Simpan"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="w-72 shrink-0 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <SortableBlockItem
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={setSelectedBlockId}
                  onToggleVisible={handleToggleVisible}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            onClick={() => setShowLibrary(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
          >
            <Plus size={16} />
            Tambah Block
          </button>
        </div>

        {selectedBlock ? (
          <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Edit Block
                </p>
                <h3 className="font-semibold text-gray-900 mt-0.5">
                  {BLOCK_LABELS[selectedBlock.type] || selectedBlock.type}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlockId(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="p-5 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 220px)" }}
              onBlur={handleContentBlur}
            >
              <BlockEditor block={selectedBlock} onChange={handleBlockChange} />
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl shadow-sm flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Pilih block di sebelah kiri untuk mulai mengedit
              </p>
              <p className="text-gray-300 text-xs mt-1">
                atau drag untuk mengatur ulang urutan
              </p>
            </div>
          </div>
        )}
      </div>

      {showLibrary && (
        <BlockLibrary
          pageKey={pageKey}
          onAdd={handleAddBlock}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
