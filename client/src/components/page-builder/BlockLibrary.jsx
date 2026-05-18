import { X } from "lucide-react";
import { nanoid } from "nanoid";

// ✅ Fungsi — bukan konstanta
// nanoid() dipanggil fresh setiap kali block ditambah
// Sebelumnya konstanta BLOCK_DEFAULTS menyebabkan ID sama untuk semua block sejenis
function getDefaultContent(type) {
  switch (type) {
    case "hero":
      return {
        variant: "page",
        badge_text: "Badge Text",
        heading: "Judul Halaman",
        heading_highlight: "",
        subheading: "Deskripsi singkat halaman Anda.",
        cta_primary_label: "Tombol Utama",
        cta_primary_url: "/",
        cta_secondary_label: "",
        cta_secondary_url: "",
      };

    case "cta":
      return {
        heading: "Siap Memulai?",
        subheading: "Hubungi kami sekarang.",
        cta_primary_label: "Hubungi Kami",
        cta_primary_url: "/contact",
        cta_secondary_label: "",
        cta_secondary_url: "",
      };

    case "rich_text":
      return { html: "<p>Tulis konten Anda di sini...</p>" };

    case "image_text":
      return {
        image_url: "",
        image_position: "left",
        heading: "Judul Section",
        body: "<p>Deskripsi di sini...</p>",
      };

    case "icon_grid":
      return {
        label: "Label Section",
        title: "Judul Section",
        subtitle: "Deskripsi section.",
        background: "white",
        items: [
          {
            id: nanoid(),
            icon: "Star",
            title: "Item 1",
            description: "Deskripsi item 1.",
          },
          {
            id: nanoid(),
            icon: "Star",
            title: "Item 2",
            description: "Deskripsi item 2.",
          },
        ],
      };

    case "products_preview":
      return {
        label: "Produk Kami",
        title: "Produk Terbaik Kami",
        subtitle: "Temukan produk kami.",
        count: 3,
      };

    case "services_preview":
      return {
        label: "Layanan Kami",
        title: "Layanan Terbaik Kami",
        subtitle: "Temukan layanan kami.",
        count: 3,
      };

    case "blog_preview":
      return {
        label: "Blog & Artikel",
        title: "Artikel Terbaru",
        subtitle: "Baca artikel terbaru kami.",
        count: 3,
      };

    case "stats":
      return {
        items: [
          { id: nanoid(), value: "10+", label: "Label 1", icon: "Star" },
          { id: nanoid(), value: "20+", label: "Label 2", icon: "Star" },
        ],
      };

    case "about_snippet":
      return {
        label: "Tentang Kami",
        heading: "Komitmen Kami",
        body: "Deskripsi singkat tentang perusahaan Anda.",
        cta_label: "Pelajari Lebih Lanjut",
        cta_url: "/about",
      };

    case "timeline":
      return {
        label: "Perjalanan Kami",
        title: "Milestone",
        subtitle: "Perjalanan kami dari waktu ke waktu.",
        items: [
          {
            id: nanoid(),
            year: "2024",
            title: "Milestone Baru",
            desc: "Deskripsi milestone.",
          },
        ],
      };

    case "team_grid":
      return {
        label: "Tim Kami",
        title: "Orang-orang di Balik Layar",
        subtitle: "Tim profesional kami.",
        items: [
          {
            id: nanoid(),
            name: "Nama Anggota",
            role: "Jabatan",
            initial: "NA",
            image_url: "",
          },
        ],
      };

    case "story":
      return {
        label: "Cerita Kami",
        heading: "Membangun Bersama",
        body_1: "Paragraf pertama cerita perusahaan.",
        body_2: "Paragraf kedua cerita perusahaan.",
        checklist: ["Point 1", "Point 2", "Point 3"],
        cards: [
          {
            id: nanoid(),
            icon: "Target",
            title: "Misi",
            color: "brand",
            desc: "Deskripsi misi.",
          },
          {
            id: nanoid(),
            icon: "Eye",
            title: "Visi",
            color: "purple",
            desc: "Deskripsi visi.",
          },
        ],
      };

    default:
      return {};
  }
}

const PAGE_BLOCKS = {
  home: [
    {
      type: "hero",
      label: "Hero Section",
      desc: "Header halaman dengan heading dan CTA",
    },
    {
      type: "stats",
      label: "Statistik",
      desc: "Grid angka pencapaian perusahaan",
    },
    {
      type: "about_snippet",
      label: "Tentang Singkat",
      desc: "Section tentang perusahaan",
    },
    {
      type: "products_preview",
      label: "Produk Preview",
      desc: "Tampilkan produk dari database",
    },
    {
      type: "services_preview",
      label: "Layanan Preview",
      desc: "Tampilkan layanan dari database",
    },
    {
      type: "blog_preview",
      label: "Blog Preview",
      desc: "Tampilkan artikel terbaru",
    },
    {
      type: "icon_grid",
      label: "Icon Grid",
      desc: "Grid item dengan icon dan teks",
    },
    { type: "image_text", label: "Gambar & Teks", desc: "Gambar di sisi teks" },
    {
      type: "rich_text",
      label: "Rich Text",
      desc: "Konten teks bebas dengan editor",
    },
    {
      type: "cta",
      label: "Call to Action",
      desc: "Section ajakan dengan tombol",
    },
  ],
  about: [
    {
      type: "hero",
      label: "Hero Section",
      desc: "Header halaman dengan heading dan CTA",
    },
    {
      type: "story",
      label: "Cerita & Visi",
      desc: "Section dua kolom cerita perusahaan",
    },
    {
      type: "timeline",
      label: "Timeline",
      desc: "Milestone perjalanan perusahaan",
    },
    { type: "team_grid", label: "Tim", desc: "Grid anggota tim perusahaan" },
    {
      type: "icon_grid",
      label: "Icon Grid",
      desc: "Grid item dengan icon dan teks",
    },
    { type: "image_text", label: "Gambar & Teks", desc: "Gambar di sisi teks" },
    {
      type: "rich_text",
      label: "Rich Text",
      desc: "Konten teks bebas dengan editor",
    },
    {
      type: "products_preview",
      label: "Produk Preview",
      desc: "Tampilkan produk dari database",
    },
    {
      type: "services_preview",
      label: "Layanan Preview",
      desc: "Tampilkan layanan dari database",
    },
    {
      type: "blog_preview",
      label: "Blog Preview",
      desc: "Tampilkan artikel terbaru",
    },
    {
      type: "cta",
      label: "Call to Action",
      desc: "Section ajakan dengan tombol",
    },
  ],
};

export default function BlockLibrary({ pageKey, onAdd, onClose }) {
  const availableBlocks = PAGE_BLOCKS[pageKey] || PAGE_BLOCKS.home;

  const handleAdd = (type) => {
    const newBlock = {
      id: nanoid(),
      type,
      visible: true,
      order: 999,
      content: getDefaultContent(type), // ✅ fresh nanoid setiap kali
    };
    onAdd(newBlock);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Tambah Block</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {availableBlocks.map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => handleAdd(type)}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
