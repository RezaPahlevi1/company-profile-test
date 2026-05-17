import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Heading2,
} from "lucide-react";

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function ImageTextEditor({ content, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...content, [field]: value });
  };

  // ✅ TipTap mini editor — tidak ada raw HTML textarea
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content.body || "",
    onUpdate: ({ editor }) => {
      handleChange("body", editor.getHTML());
    },
  });

  // ✅ Sync jika block berbeda dipilih
  useEffect(() => {
    if (editor && content.body !== editor.getHTML()) {
      editor.commands.setContent(content.body || "");
    }
  }, [content.body]);

  return (
    <div className="space-y-6">
      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="text"
          value={content.image_url || ""}
          onChange={(e) => handleChange("image_url", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Masukkan URL gambar.</p>

        {content.image_url && (
          <div className="mt-3 aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-gray-200 bg-gray-50 relative">
            <img
              src={content.image_url}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
              style={{ display: "none" }}
            >
              URL gambar tidak valid
            </div>
          </div>
        )}
      </div>

      {/* Image Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Posisi Gambar
        </label>
        <select
          value={content.image_position || "left"}
          onChange={(e) => handleChange("image_position", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="left">Kiri</option>
          <option value="right">Kanan</option>
        </select>
      </div>

      {/* Heading */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Heading
        </label>
        <input
          type="text"
          value={content.heading || ""}
          onChange={(e) => handleChange("heading", e.target.value)}
          placeholder="Judul Section..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Body — TipTap mini, bukan textarea raw HTML */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teks
        </label>
        {editor && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                title="Bold"
              >
                <Bold size={13} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                title="Italic"
              >
                <Italic size={13} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                title="Underline"
              >
                <UnderlineIcon size={13} />
              </ToolbarBtn>
              <div className="w-px h-4 bg-gray-200 mx-1" />
              <ToolbarBtn
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                active={editor.isActive("heading", { level: 3 })}
                title="Heading"
              >
                <Heading2 size={13} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                title="Bullet List"
              >
                <List size={13} />
              </ToolbarBtn>
            </div>
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none p-3 min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
