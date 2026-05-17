# Page Builder — Dokumentasi Lengkap

> Dokumen ini mencatat semua keputusan arsitektur, stack, progress pengerjaan, dan rencana ke depan untuk fitur Page Builder pada project Company Profile CMS.

---

## 1. Latar Belakang

Website company profile ini awalnya memiliki halaman **Home** dan **About** yang sepenuhnya hardcode di React. Semua teks, section, dan layout dikontrol langsung di kode, sehingga tidak bisa diubah tanpa menyentuh source code.

Kebutuhan yang muncul: **superadmin harus bisa mengkustomisasi halaman Home dan About secara penuh dari panel admin**, tanpa perlu akses ke kode. Termasuk:

- Mengatur urutan section (drag & drop)
- Menyembunyikan atau menampilkan section
- Menambah section baru
- Menghapus section
- Mengedit semua teks, gambar, dan konten
- Undo dan redo perubahan

---

## 2. Pendekatan yang Dipilih

### Hybrid Block-based CMS

Bukan fully visual builder (seperti Webflow) dan bukan pure structured CMS (seperti Contentful). Pendekatannya adalah **hybrid**:

- Admin bebas tambah, hapus, reorder block di posisi mana saja
- Setiap block punya type yang sudah ditentukan dengan desain yang konsisten
- Konten di dalam block bisa diedit bebas
- Beberapa block bisa ditambah berkali-kali (contoh: `rich_text` bisa ada 3 sekaligus)

### Kenapa Hybrid?

- **Konsistensi desain terjaga** — layout dan styling per block sudah dirancang, admin tidak bisa merusak tampilan
- **Fleksibilitas cukup** — admin bisa susun halaman sesuai kebutuhan
- **Development time realistis** — fully visual builder seperti Webflow butuh berbulan-bulan
- **UX lebih mudah** — admin non-technical lebih mudah pakai block yang jelas labelnya

---

## 3. Stack & Dependencies

### Yang Sudah Ada di Project

| Teknologi | Versi | Kegunaan di Page Builder |
|-----------|-------|--------------------------|
| React | 19 | Framework utama |
| TanStack React Query | v5 | Fetch dan cache config dari backend |
| Supabase (PostgreSQL) | — | Simpan config blocks sebagai JSONB |
| TipTap | v3 | Editor rich text untuk block `rich_text` dan `image_text` |
| Tailwind CSS | v4 | Styling semua block dan UI builder |
| Framer Motion | v12 | Animasi di block renderer publik |
| Axios | — | HTTP client via axiosInstance |

### Tambahan Baru

| Package | Kegunaan |
|---------|----------|
| `@dnd-kit/core` | Engine drag & drop untuk reorder blocks |
| `@dnd-kit/sortable` | Sortable list dengan animasi |
| `@dnd-kit/utilities` | CSS transform utilities untuk dnd |
| `nanoid` | Generate unique ID untuk setiap block baru |

### Install Command

```bash
# Di folder client
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities nanoid
```

---

## 4. Arsitektur Data

### Tabel Database: `page_configs`

```sql
CREATE TABLE public.page_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key varchar NOT NULL UNIQUE,  -- "home" | "about"
  blocks jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.admins(id) ON DELETE SET NULL
);
```

### Struktur Satu Block (JSONB)

```json
{
  "id": "unique-id-string",
  "type": "hero",
  "visible": true,
  "order": 1,
  "content": {
    // berbeda-beda per block type
  }
}
```

### Field `content` Per Block Type

#### `hero`
```json
{
  "variant": "home | page",
  "badge_text": "Solusi Digital Terpercaya",
  "heading": "Transformasi Digital Bisnis Anda",
  "heading_highlight": "Bisnis Anda",
  "subheading": "Deskripsi...",
  "cta_primary_label": "Lihat Produk",
  "cta_primary_url": "/products",
  "cta_secondary_label": "Hubungi Kami",
  "cta_secondary_url": "/contact"
}
```

#### `stats` (Home only)
```json
{
  "items": [
    { "id": "s1", "value": "50+", "label": "Klien Puas", "icon": "Users" }
  ]
}
```

#### `about_snippet` (Home only)
```json
{
  "label": "Tentang Kami",
  "heading": "Kami Berkomitmen...",
  "body": "Teks paragraf...",
  "cta_label": "Pelajari Lebih Lanjut",
  "cta_url": "/about"
}
```

#### `story` (About only)
```json
{
  "label": "Cerita Kami",
  "heading": "Membangun Masa Depan Digital",
  "body_1": "Paragraf pertama...",
  "body_2": "Paragraf kedua...",
  "checklist": ["Point 1", "Point 2"],
  "cards": [
    { "id": "c1", "icon": "Target", "title": "Misi", "color": "brand", "desc": "..." }
  ]
}
```

#### `timeline` (About only)
```json
{
  "label": "Perjalanan Kami",
  "title": "Milestone Perusahaan",
  "subtitle": "Deskripsi...",
  "items": [
    { "id": "t1", "year": "2019", "title": "Perusahaan Didirikan", "desc": "..." }
  ]
}
```

#### `team_grid` (About only)
```json
{
  "label": "Tim Kami",
  "title": "Orang-orang di Balik Layar",
  "subtitle": "Deskripsi...",
  "items": [
    { "id": "tm1", "name": "Nama", "role": "Jabatan", "initial": "NA", "image_url": "" }
  ]
}
```

#### `icon_grid` (Shared)
```json
{
  "label": "Label Section",
  "title": "Judul Section",
  "subtitle": "Deskripsi...",
  "background": "white | slate",
  "items": [
    { "id": "i1", "icon": "Lightbulb", "title": "Inovasi", "description": "..." }
  ]
}
```

#### `products_preview` / `services_preview` / `blog_preview` (Shared)
```json
{
  "label": "Label Section",
  "title": "Judul Section",
  "subtitle": "Deskripsi...",
  "count": 3
}
```

#### `rich_text` (Shared)
```json
{
  "html": "<p>Konten HTML dari TipTap...</p>"
}
```

#### `image_text` (Shared)
```json
{
  "image_url": "https://...",
  "image_position": "left | right",
  "heading": "Judul Section",
  "body": "<p>Konten HTML...</p>"
}
```

#### `cta` (Shared)
```json
{
  "heading": "Siap Memulai?",
  "subheading": "Deskripsi...",
  "cta_primary_label": "Hubungi Kami",
  "cta_primary_url": "/contact",
  "cta_secondary_label": "Lihat Produk",
  "cta_secondary_url": "/products"
}
```

---

## 5. Block Registry

### Shared Blocks (Home & About)

| Type | Label | Deskripsi |
|------|-------|-----------|
| `hero` | Hero Section | Header halaman dengan heading, badge, dan CTA. Punya variant `home` (fullscreen + orbs) dan `page` (compact) |
| `cta` | Call to Action | Section ajakan di akhir halaman dengan tombol |
| `rich_text` | Rich Text | Konten teks bebas via TipTap. Bisa ditambah berkali-kali |
| `image_text` | Gambar & Teks | Layout dua kolom: gambar di kiri atau kanan, teks di sebelahnya |
| `icon_grid` | Icon Grid | Grid item dengan icon Lucide, judul, dan deskripsi. Reusable untuk values, features, dll |
| `products_preview` | Produk Preview | Menampilkan N produk aktif dari database |
| `services_preview` | Layanan Preview | Menampilkan N layanan aktif dari database |
| `blog_preview` | Blog Preview | Menampilkan N artikel published dari database |

### Home-specific Blocks

| Type | Label | Deskripsi |
|------|-------|-----------|
| `stats` | Statistik | Grid angka pencapaian perusahaan. Admin bisa tambah/hapus/edit tiap item |
| `about_snippet` | Tentang Singkat | Section tentang perusahaan dengan teks dan satu CTA |

### About-specific Blocks

| Type | Label | Deskripsi |
|------|-------|-----------|
| `story` | Cerita & Visi | Layout dua kolom: teks + checklist di kiri, grid cards (misi/visi/nilai/tim) di kanan |
| `timeline` | Timeline | Milestone zigzag. Admin bisa tambah/hapus/edit tiap milestone |
| `team_grid` | Tim | Grid avatar anggota tim. Admin bisa tambah/hapus/edit, upload foto atau pakai inisial |

**Total: 13 block types**

---

## 6. Struktur Folder

```
src/
├── api/
│   └── pageBuilder.js              ← getPageConfig, updatePageConfig
│
├── components/
│   └── page-builder/
│       ├── BlockRenderer.jsx       ← switch type → render block publik
│       ├── BlockEditor.jsx         ← switch type → render form editor
│       ├── PageBuilder.jsx         ← UI admin builder utama
│       ├── BlockLibrary.jsx        ← modal pilih block baru
│       │
│       ├── blocks/
│       │   ├── shared/
│       │   │   ├── HeroBlock.jsx
│       │   │   ├── CtaBlock.jsx
│       │   │   ├── RichTextBlock.jsx
│       │   │   ├── ImageTextBlock.jsx
│       │   │   ├── IconGridBlock.jsx
│       │   │   ├── ProductsPreviewBlock.jsx
│       │   │   ├── ServicesPreviewBlock.jsx
│       │   │   └── BlogPreviewBlock.jsx
│       │   ├── home/
│       │   │   ├── StatsBlock.jsx
│       │   │   └── AboutSnippetBlock.jsx
│       │   └── about/
│       │       ├── TimelineBlock.jsx
│       │       ├── TeamGridBlock.jsx
│       │       └── StoryBlock.jsx
│       │
│       └── editors/
│           ├── shared/
│           │   ├── HeroEditor.jsx
│           │   ├── CtaEditor.jsx
│           │   ├── RichTextEditor.jsx
│           │   ├── ImageTextEditor.jsx
│           │   ├── IconGridEditor.jsx
│           │   ├── ProductsPreviewEditor.jsx
│           │   ├── ServicesPreviewEditor.jsx
│           │   └── BlogPreviewEditor.jsx
│           ├── home/
│           │   ├── StatsEditor.jsx
│           │   └── AboutSnippetEditor.jsx
│           └── about/
│               ├── TimelineEditor.jsx
│               ├── TeamGridEditor.jsx
│               └── StoryEditor.jsx
│
└── pages/
    ├── public/
    │   ├── Home.jsx                ← refactor: render dari page config
    │   └── About.jsx               ← refactor: render dari page config
    └── admin/
        └── page-builder/
            ├── HomeBuilder.jsx     ← <PageBuilder pageKey="home" />
            └── AboutBuilder.jsx    ← <PageBuilder pageKey="about" />
```

---

## 7. Arsitektur Frontend — Alur Data

```
Admin buka /admin/builder/home
  └─ HomeBuilder.jsx
       └─ PageBuilder.jsx (pageKey="home")
            ├─ useQuery: getPageConfig("home") → fetch dari backend
            ├─ State: history[] + cursor (undo/redo)
            ├─ DndContext: reorder blocks
            ├─ Klik block → BlockEditor.jsx
            │    └─ switch block.type → Editor yang sesuai
            │         └─ onChange → update state lokal
            └─ Save → updatePageConfig("home", blocks) → PUT /api/page-builder/home

Halaman publik buka /
  └─ Home.jsx
       ├─ useQuery: getPageConfig("home") → fetch config
       └─ blocks.map(block =>
            └─ BlockRenderer.jsx
                 └─ switch block.type → Block component yang sesuai
```

---

## 8. Backend

### Endpoint

| Method | URL | Auth | Deskripsi |
|--------|-----|------|-----------|
| GET | `/api/page-builder/:pageKey` | Public | Ambil config halaman |
| PUT | `/api/page-builder/:pageKey` | Superadmin | Update config halaman |

### Validasi di Backend

- `pageKey` harus `"home"` atau `"about"`
- `blocks` harus array
- Setiap block harus punya `id` (string) dan `visible` (boolean)
- `block.type` harus ada dalam whitelist per `pageKey`
- `order` di-normalize ulang oleh backend (1, 2, 3, ...) saat save

### File Backend

| File | Lokasi |
|------|--------|
| `pageBuilderController.js` | `server/src/controllers/` |
| `pageBuilderRoutes.js` | `server/src/routes/` |

### Tambah di `app.js`

```js
import pageBuilderRoutes from "./routes/pageBuilderRoutes.js";
app.use("/api/page-builder", pageBuilderRoutes);
```

---

## 9. Fitur Undo/Redo

### Implementasi

State history adalah array of snapshots. Cursor menunjuk ke snapshot saat ini.

```js
const [history, setHistory] = useState([[]])  // array of blocks[]
const [cursor, setCursor] = useState(0)

const blocks = history[cursor]  // state saat ini

// Setiap perubahan struktural (reorder, add, delete, toggle visible):
const pushHistory = (newBlocks) => {
  const sliced = history.slice(0, cursor + 1)  // hapus redo stack
  setHistory([...sliced, newBlocks])
  setCursor(sliced.length)
}

// Edit konten (mengetik): update in-place tanpa push
// Blur dari editor: push ke history

const undo = () => cursor > 0 && setCursor(c => c - 1)
const redo = () => cursor < history.length - 1 && setCursor(c => c + 1)
```

### Keyboard Shortcuts

| Shortcut | Aksi |
|----------|------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo (alternatif) |

### Batasan

- History hanya ada selama session — refresh atau tutup tab = history hilang
- Tidak ada limit jumlah history (bisa ditambah limit 50 jika perlu)

---

## 10. Progress Pengerjaan

### ✅ Phase 1 — Foundation (SELESAI)

| Task | Status | File |
|------|--------|------|
| SQL tabel `page_configs` + seed data | ✅ | `page_configs.sql` |
| Backend controller GET/PUT | ✅ | `pageBuilderController.js` |
| Backend routes | ✅ | `pageBuilderRoutes.js` |
| API functions frontend | ✅ | `api/pageBuilder.js` |
| `BlockRenderer.jsx` skeleton | ✅ | Imports semua block, switch by type |
| `BlockEditor.jsx` skeleton | ✅ | Imports semua editor, switch by type |
| `PageBuilder.jsx` — UI utama | ✅ | Drag & drop, undo/redo, editor panel, save |
| `BlockLibrary.jsx` — modal add | ✅ | Semua block types dengan default content |
| `HomeBuilder.jsx` wrapper | ✅ | |
| `AboutBuilder.jsx` wrapper | ✅ | |

---

### ⏳ Phase 2 — Shared Block Renderers & Editors

Block renderer = tampilan di halaman publik
Block editor = form edit di panel admin

| Block | Renderer | Editor | Status |
|-------|----------|--------|--------|
| `hero` | `HeroBlock.jsx` | `HeroEditor.jsx` | ⏳ |
| `cta` | `CtaBlock.jsx` | `CtaEditor.jsx` | ⏳ |
| `rich_text` | `RichTextBlock.jsx` | `RichTextEditor.jsx` | ⏳ |
| `image_text` | `ImageTextBlock.jsx` | `ImageTextEditor.jsx` | ⏳ |
| `icon_grid` | `IconGridBlock.jsx` | `IconGridEditor.jsx` | ⏳ |
| `products_preview` | `ProductsPreviewBlock.jsx` | `ProductsPreviewEditor.jsx` | ⏳ |
| `services_preview` | `ServicesPreviewBlock.jsx` | `ServicesPreviewEditor.jsx` | ⏳ |
| `blog_preview` | `BlogPreviewBlock.jsx` | `BlogPreviewEditor.jsx` | ⏳ |

---

### ⏳ Phase 3 — Home-specific + Refactor Home.jsx

| Task | Status |
|------|--------|
| `StatsBlock.jsx` renderer | ⏳ |
| `StatsEditor.jsx` — tambah/hapus/edit items | ⏳ |
| `AboutSnippetBlock.jsx` renderer | ⏳ |
| `AboutSnippetEditor.jsx` | ⏳ |
| Refactor `Home.jsx` → render dari config DB | ⏳ |
| Seed default Home config sudah ada di SQL | ✅ |

---

### ⏳ Phase 4 — About-specific + Refactor About.jsx

| Task | Status |
|------|--------|
| `TimelineBlock.jsx` renderer | ⏳ |
| `TimelineEditor.jsx` — tambah/hapus/edit milestones | ⏳ |
| `TeamGridBlock.jsx` renderer | ⏳ |
| `TeamGridEditor.jsx` — tambah/hapus/edit anggota + upload foto | ⏳ |
| `StoryBlock.jsx` renderer | ⏳ |
| `StoryEditor.jsx` — edit teks, checklist, cards | ⏳ |
| Refactor `About.jsx` → render dari config DB | ⏳ |
| Seed default About config sudah ada di SQL | ✅ |

---

### ⏳ Phase 5 — Polish & Integration

| Task | Status |
|------|--------|
| Tambah route `builder/home` dan `builder/about` di `App.jsx` | ⏳ |
| Tambah menu di `AdminSidebar.jsx` | ⏳ |
| Test end-to-end semua block di Home | ⏳ |
| Test end-to-end semua block di About | ⏳ |
| Test undo/redo semua operasi | ⏳ |
| Test drag & drop reorder | ⏳ |
| Test add/delete block | ⏳ |
| Test visibility toggle | ⏳ |
| Test di mobile (builder responsive) | ⏳ |

---

## 11. Catatan Penting Implementasi

### `rich_text` dan `image_text` — TipTap

Editor TipTap sudah ada di project (`BlogForm.jsx`). Untuk page builder, kita buat versi yang lebih ringan tanpa fitur blog-specific (tidak perlu mention, cover image, dll). Cukup: heading, bold, italic, list, link, dan image insert.

### `image_text` dan `team_grid` — Image Upload

Upload gambar menggunakan endpoint yang sama dengan upload produk/layanan — via Supabase Storage. Pattern yang dipakai: file input → multipart upload → dapat URL → simpan ke content block.

### `icon_grid` — Icon Picker

Icons yang tersedia dipilih dari subset Lucide React yang sudah ada di project. Disediakan sebagai dropdown/grid pilihan, bukan input teks bebas, untuk mencegah typo nama icon.

### Seed Data

Seed data di `page_configs.sql` mencerminkan tampilan Home dan About saat ini. Saat admin pertama buka builder, semua section sudah ada dan tinggal diedit — tidak perlu mulai dari scratch.

### Public Page Fetch

Halaman publik (`Home.jsx`, `About.jsx`) akan fetch config dari `GET /api/page-builder/:pageKey` yang **tidak butuh auth**. Query key di React Query: `["public-page-config-home"]` dan `["public-page-config-about"]`.

Saat admin save dari builder, query ini di-invalidate agar halaman publik ikut update saat di-refresh.

### Fallback

Jika config belum ada di database atau fetch gagal, `Home.jsx` dan `About.jsx` menampilkan halaman kosong dengan pesan "Halaman sedang dikonfigurasi" — bukan crash.

---

## 12. Hal yang Tidak Diimplementasi (By Design)

| Fitur | Alasan |
|-------|--------|
| Preview real-time | Terlalu berat — cukup pakai tombol Preview yang buka tab baru |
| Versioning / rollback | Tidak diminta — undo/redo sudah cukup untuk session saat ini |
| Undo/redo persist setelah refresh | Tidak diperlukan — history session saja sudah cukup |
| Fully visual drag layout (kolom, grid custom) | Scope terlalu besar — hybrid block sudah memenuhi kebutuhan |
| Page builder untuk halaman selain Home & About | Tidak diperlukan — halaman lain sudah punya CMS sendiri |

---

## 13. Estimasi Timeline

| Phase | Estimasi | Status |
|-------|----------|--------|
| Phase 1 — Foundation | 1-2 hari | ✅ Selesai |
| Phase 2 — Shared Blocks (8 block) | kerjakan sekarang | ⏳ |
| Phase 3 — Home specific + refactor | kerjakan selanjutnya | ⏳ |
| Phase 4 — About specific + refactor | kerjakan selanjutnya | ⏳ |
| Phase 5 — Polish & integration | kerjakan selanjutnya | ⏳ |

---

*Dokumen ini diperbarui seiring progress pengerjaan.*