import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url)
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
  };

  const buttons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      icon: <Bold size={14} />,
      title: "Bold",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      icon: <Italic size={14} />,
      title: "Italic",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      icon: <Heading2 size={14} />,
      title: "H2",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      icon: <Heading3 size={14} />,
      title: "H3",
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      icon: <List size={14} />,
      title: "Bullet",
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      icon: <ListOrdered size={14} />,
      title: "Ordered",
    },
    {
      action: setLink,
      active: editor.isActive("link"),
      icon: <LinkIcon size={14} />,
      title: "Link",
    },
    {
      action: addImage,
      active: false,
      icon: <ImageIcon size={14} />,
      title: "Image",
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {buttons.map(({ action, active, icon, title }) => (
        <button
          key={title}
          type="button"
          onClick={action}
          title={title}
          className={`p-2 rounded text-sm transition-colors ${active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-200"}`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Tulis konten di sini...",
      }),
    ],
    content: content.html || "",
    onUpdate: ({ editor }) => {
      onChange({ ...content, html: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    
    // Sinkronisasi jika content.html berubah dari luar (misal: undo/redo)
    const currentHtml = editor.getHTML();
    if (content.html !== currentHtml) {
      editor.commands.setContent(content.html || "");
    }
  }, [content.html, editor]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Konten (Rich Text)</label>
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <MenuBar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-3 sm:p-4 min-h-[200px] focus:outline-none"
        />
      </div>
    </div>
  );
}
