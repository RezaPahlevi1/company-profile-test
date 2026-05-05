# 00 — Master Roadmap

## Status Project

### ✅ Phase 1 — Selesai (Presentasi)

Semua fitur dasar company profile sudah selesai dan dipresentasikan.

**Fitur yang sudah ada:**

- Halaman publik lengkap (Home, About, Products, Services, Blog, Contact)
- Guest checkout dengan Midtrans payment gateway
- Order tracking via nomor order
- Repay untuk order pending
- Email notifikasi (order created + payment success) via Resend
- Admin dashboard dengan CRUD Products, Services, Blog
- Manajemen order (view, confirm paid, cancel)
- Auth admin dengan JWT httpOnly cookie
- Upload gambar ke Supabase Storage
- Blog dengan TipTap rich text editor, kategori, dan tag
- Visitor tracking foundation sudah ada

---

### 🚧 Phase 2 — Development Berikutnya

Urutan pengerjaan berdasarkan prioritas dan dependency:

```
1. Multi-Role Admin          → fondasi semua fitur phase 2
2. Site Settings             → logo, rename halaman, payment expiry
3. Fitur Promo               → products + services + popup publik
4. Visitor Tracking          → analytics di dashboard superadmin
5. Sistem Email Lanjutan     → custom template + broadcast
```

---

## Daftar Dokumen

| File                     | Fitur                                                 | Status           |
| ------------------------ | ----------------------------------------------------- | ---------------- |
| `01-multi-role-admin.md` | Superadmin, admin konten, admin order                 | ✅ Selesai       |
| `02-site-settings.md`    | Logo navbar, rename halaman, payment expiry, estimasi | ⬜ Belum dimulai |
| `03-fitur-promo.md`      | Diskon produk, label promo jasa, popup publik         | ⬜ Belum dimulai |
| `04-visitor-tracking.md` | Kunjungan per hari, negara, device, chart             | ⬜ Belum dimulai |
| `05-sistem-email.md`     | Custom template, estimasi di email, broadcast         | ⬜ Belum dimulai |

---

## Dependency Antar Fitur

```
01-multi-role-admin
    ├── Dibutuhkan oleh semua fitur lain (role check di setiap endpoint baru)
    └── Harus selesai PERTAMA

02-site-settings
    ├── Bergantung pada: 01 (superadmin only)
    ├── Dibutuhkan oleh: 03 (payment expiry), 05 (estimasi di email)
    └── Sebaiknya selesai KEDUA

03-fitur-promo
    ├── Bergantung pada: 01 (superadmin only), 02 (site_settings struktur)
    └── Bisa dikerjakan paralel dengan 04

04-visitor-tracking
    ├── Bergantung pada: 01 (superadmin only untuk dashboard)
    └── Bisa dikerjakan paralel dengan 03

05-sistem-email
    ├── Bergantung pada: 01 (superadmin only), 02 (delivery_estimation)
    └── Dikerjakan terakhir
```

---

## Database Changes Summary (Phase 2)

```sql
-- 01: Multi-role
ALTER TABLE admins ADD COLUMN role VARCHAR(20) DEFAULT 'superadmin';

-- 02: Site settings
CREATE TABLE site_settings (...);
CREATE TABLE page_settings (...);

-- 03: Promo
ALTER TABLE products ADD COLUMN discount_percent DECIMAL(5,2);
ALTER TABLE products ADD COLUMN is_promo BOOLEAN;
ALTER TABLE services ADD COLUMN is_promo BOOLEAN;

-- 04: Visitor tracking
CREATE TABLE visits (...);

-- 05: Email system
CREATE TABLE email_templates (...);
CREATE TABLE email_broadcasts (...);
```

---

## Tech Stack Tambahan (Phase 2)

| Package              | Kegunaan                         | Untuk Fitur      |
| -------------------- | -------------------------------- | ---------------- |
| `geoip-lite`         | IP → negara (offline)            | Visitor tracking |
| `useragent`          | Parse user-agent → device type   | Visitor tracking |
| Recharts (sudah ada) | Line chart, pie chart analytics  | Visitor tracking |
| CodeMirror (baru)    | HTML editor untuk email template | Email system     |

---

## Catatan untuk Developer

1. **Selalu mulai dari backend** — buat dan test endpoint dulu sebelum build UI
2. **Role check di setiap endpoint baru** — jangan lupa tambahkan `requireRole()` middleware
3. **Invalidate React Query cache** saat ada perubahan data yang mempengaruhi halaman lain
4. **Seed data default** untuk setiap tabel baru yang butuh nilai awal
5. **ngrok harus aktif** saat testing webhook Midtrans di development
6. **Update file .md ini** saat satu fitur selesai dikerjakan — ubah status dari ⬜ ke ✅
