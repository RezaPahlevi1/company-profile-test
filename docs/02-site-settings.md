# 02 — Site Settings

## Overview
Halaman Settings untuk superadmin mengatur konfigurasi global website. Dibagi menjadi dua halaman terpisah: Site Settings dan Manage Admins (lihat dokumen 01).

Route: `/admin/settings/site`

---

## Fitur dalam Site Settings

### A. Identitas & Branding
- **Nama website** — ditampilkan di navbar dan browser tab
- **Logo navbar** — upload gambar, tampil di navbar publik
  - Bisa upload logo baru
  - Bisa hapus logo (kembali ke text)
  - Preview logo sebelum disimpan
- **Deskripsi website** — untuk meta description SEO

### B. Konfigurasi Halaman Publik
Superadmin bisa aktifkan/nonaktifkan dan rename setiap halaman publik.

| Halaman | Title | Navbar Label | Status |
|---|---|---|---|
| Home | Home | Home | ✅ Aktif |
| About | Tentang Kami | About | ✅ Aktif |
| Products | Produk Kami | Products | ✅ Aktif |
| Services | Layanan | Services | ✅ Aktif |
| Blog | Blog | Blog | ✅ Aktif |
| Contact | Hubungi Kami | Contact | ✅ Aktif |

Catatan: halaman Home tidak bisa dinonaktifkan.

### C. Payment Settings
- **Durasi expiry pembayaran** — dalam jam (default: 24 jam)
  - Range: 1–168 jam (1 minggu maksimal)
  - Berlaku untuk semua order baru setelah setting diubah

### D. Estimasi Produk/Layanan
- **Teks estimasi** — contoh: "3-5 hari kerja", "Selesai dalam 1 minggu"
- Ditampilkan di halaman detail produk dan halaman publik services
- Bisa diset sebagai teks global atau per produk (per produk lebih kompleks, diskusikan dulu)

---

## Database

```sql
-- Tabel site_settings: key-value store
CREATE TABLE site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed nilai default
INSERT INTO site_settings (key, value) VALUES
  ('site_name', 'CompanyName'),
  ('navbar_logo_url', ''),
  ('site_description', 'Solusi digital terpercaya untuk bisnis Anda'),
  ('payment_expiry_hours', '24'),
  ('delivery_estimation', '3-5 hari kerja');

-- Tabel page_settings
CREATE TABLE page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  navbar_label VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed halaman default
INSERT INTO page_settings (page_key, title, navbar_label, is_active) VALUES
  ('home', 'Home', 'Home', true),
  ('about', 'Tentang Kami', 'About', true),
  ('products', 'Produk Kami', 'Products', true),
  ('services', 'Layanan', 'Services', true),
  ('blog', 'Blog', 'Blog', true),
  ('contact', 'Hubungi Kami', 'Contact', true);
```

---

## Backend

### Endpoints Baru

```
GET    /api/settings/site          → ambil semua site settings (public)
PUT    /api/settings/site          → update site settings (superadmin)
GET    /api/settings/pages         → ambil semua page settings (public)
PUT    /api/settings/pages/:key    → update satu page setting (superadmin)
POST   /api/settings/logo          → upload logo (superadmin)
DELETE /api/settings/logo          → hapus logo (superadmin)
```

Catatan: `GET /api/settings/site` dan `GET /api/settings/pages` bisa diakses publik karena dibutuhkan oleh Navbar dan halaman publik.

---

## Frontend

### Perubahan di Navbar
```jsx
// Navbar fetch page_settings dan site_settings
// staleTime: 10 menit agar tidak fetch ulang setiap pindah halaman
const { data } = useQuery({
  queryKey: ['page-settings'],
  queryFn: getPageSettings,
  staleTime: 1000 * 60 * 10
})

// Render label dari database, bukan hardcode
// Render logo kalau ada, text kalau tidak ada
```

### Perubahan di Halaman Publik
Setiap halaman publik cek apakah `is_active = true`:
```jsx
// Di setiap halaman publik
const { data: pageSettings } = useQuery(...)
const thisPage = pageSettings?.find(p => p.page_key === 'about')

if (!thisPage?.is_active) {
  return <Navigate to="/404" replace />
}
```

### Halaman Site Settings Admin
Dibagi menjadi beberapa section dengan card masing-masing:
1. **Branding** — nama site, upload logo
2. **Halaman Publik** — tabel dengan toggle aktif/nonaktif dan input rename
3. **Pembayaran** — input durasi expiry
4. **Estimasi** — input teks estimasi

---

## Catatan Penting
- Logo disimpan di Supabase Storage bucket `settings/`
- Perubahan page settings langsung efektif — tidak perlu reload server
- Payment expiry hanya berlaku untuk order baru, tidak retroaktif
- React Query cache page_settings dengan staleTime panjang untuk performa
