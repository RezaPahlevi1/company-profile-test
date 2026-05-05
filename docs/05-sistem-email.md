# 05 — Sistem Email

## Overview
Pengembangan sistem email dari yang sekarang sudah ada (order created + payment success) menjadi sistem yang lebih lengkap dengan tiga fitur tambahan:
1. Custom template email oleh superadmin
2. Estimasi produk/layanan di email
3. Broadcast email ke semua buyer

---

## Kondisi Email Saat Ini
- ✅ Email order created — terkirim saat order dibuat
- ✅ Email payment success — terkirim saat webhook paid diterima
- ❌ Template tidak bisa diubah — hardcode di kode
- ❌ Tidak ada estimasi produk
- ❌ Tidak ada broadcast email

---

## Fitur 1 — Custom Email Template

### Konsep
Superadmin bisa mengedit template HTML email langsung dari dashboard. Template menggunakan **variabel placeholder** yang akan diganti dengan data nyata saat email dikirim.

### Variabel yang Tersedia

**Untuk template Order Created:**
```
{{buyer_name}}        → nama pembeli
{{order_number}}      → nomor order
{{order_items}}       → tabel item pesanan (auto-generated)
{{total_amount}}      → total harga
{{buyer_email}}       → email pembeli
{{buyer_phone}}       → nomor HP pembeli
{{buyer_address}}     → alamat pembeli
{{order_date}}        → tanggal order
{{track_url}}         → URL halaman tracking order
{{payment_expiry}}    → batas waktu pembayaran
{{site_name}}         → nama website dari site_settings
```

**Untuk template Payment Success:**
```
{{buyer_name}}
{{order_number}}
{{order_items}}
{{total_amount}}
{{payment_method}}    → metode pembayaran
{{paid_at}}           → tanggal dan waktu bayar
{{delivery_estimation}} → estimasi dari site_settings
{{track_url}}
{{site_name}}
```

### Database

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(50) UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  html_body TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed template default (ambil dari kode yang sudah ada)
INSERT INTO email_templates (template_key, subject, html_body) VALUES
  ('order_created', '✅ Order {{order_number}} Berhasil Dibuat', '...html template...'),
  ('payment_success', '🎉 Pembayaran {{order_number}} Berhasil', '...html template...');
```

### Backend — Render Template

```js
// utils/emailService.js — fungsi render template
const renderTemplate = (template, variables) => {
  let rendered = template
  Object.entries(variables).forEach(([key, value]) => {
    rendered = rendered.replaceAll(`{{${key}}}`, value || '')
  })
  return rendered
}

// Sebelum kirim email, ambil template dari database
const sendOrderCreatedEmail = async (order, items) => {
  const { data: template } = await supabase
    .from('email_templates')
    .select('subject, html_body')
    .eq('template_key', 'order_created')
    .single()

  const variables = {
    buyer_name: order.buyer_name,
    order_number: order.order_number,
    // ...dst
  }

  const subject = renderTemplate(template.subject, variables)
  const html = renderTemplate(template.html_body, variables)

  await resend.emails.send({ to: order.buyer_email, subject, html })
}
```

### Frontend — Halaman Edit Template

Route: `/admin/settings/email-templates`

UI:
- Dropdown pilih template (Order Created / Payment Success)
- Input untuk subject email
- Rich text/HTML editor untuk body email (bisa pakai CodeMirror atau textarea biasa)
- Panel preview di sebelah kanan — render template dengan data dummy
- Tombol "Reset ke Default" — kembalikan ke template bawaan
- Tombol "Simpan"
- Daftar variabel yang tersedia dengan tombol copy

---

## Fitur 2 — Estimasi Produk/Layanan di Email

### Konsep
Teks estimasi diambil dari `site_settings` key `delivery_estimation` dan dimasukkan ke template email payment success sebagai `{{delivery_estimation}}`.

Superadmin set teks estimasi di halaman Site Settings:
```
Estimasi penyelesaian: 3-5 hari kerja
```

Ini otomatis muncul di email payment success di bagian:
> "Pesanan Anda sedang diproses. Estimasi penyelesaian: **3-5 hari kerja**"

Tidak perlu tabel atau database baru — cukup tambahkan key `delivery_estimation` di `site_settings`.

---

## Fitur 3 — Broadcast Email

### Konsep
Superadmin bisa kirim email ke semua buyer yang pernah melakukan order (dengan status paid). Berguna untuk pengumuman promo, update layanan, atau informasi penting.

### Database

```sql
CREATE TABLE email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(200) NOT NULL,
  html_body TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Backend

```
GET    /api/broadcasts              → list semua broadcast
POST   /api/broadcasts              → buat broadcast baru (draft)
PUT    /api/broadcasts/:id          → edit draft
POST   /api/broadcasts/:id/send     → kirim broadcast
GET    /api/broadcasts/preview-recipients → jumlah dan list email penerima
```

**Logika pengiriman:**
```js
export const sendBroadcast = async (req, res) => {
  const { id } = req.params

  // Ambil broadcast
  const broadcast = await getBroadcastById(id)
  if (broadcast.status !== 'draft') {
    return res.status(400).json({ message: 'Broadcast already sent' })
  }

  // Ambil semua email buyer yang pernah paid
  const { data: orders } = await supabase
    .from('orders')
    .select('buyer_email, buyer_name')
    .eq('status', 'paid')

  // Deduplikasi email
  const uniqueBuyers = [...new Map(
    orders.map(o => [o.buyer_email, o])
  ).values()]

  // Update status jadi sending
  await updateBroadcastStatus(id, 'sending')

  // Kirim batch email (Resend support batch)
  const emails = uniqueBuyers.map(buyer => ({
    from: process.env.RESEND_FROM_EMAIL,
    to: buyer.buyer_email,
    subject: renderTemplate(broadcast.subject, { buyer_name: buyer.buyer_name }),
    html: renderTemplate(broadcast.html_body, { buyer_name: buyer.buyer_name })
  }))

  await resend.batch.send(emails)

  // Update status dan jumlah penerima
  await updateBroadcastStatus(id, 'sent', uniqueBuyers.length)

  return res.status(200).json({ success: true, recipientCount: uniqueBuyers.length })
}
```

### Frontend — Halaman Broadcast

Route: `/admin/settings/broadcasts`

UI:
- List semua broadcast (subject, status, jumlah penerima, tanggal kirim)
- Tombol buat broadcast baru → form (subject + HTML editor)
- Status indicator: Draft / Sending / Sent / Failed
- Preview berapa penerima sebelum kirim
- Konfirmasi modal sebelum kirim — "Anda akan mengirim email ke X pembeli. Lanjutkan?"
- Tidak bisa edit atau hapus broadcast yang sudah terkirim

### Variabel di Broadcast
```
{{buyer_name}}   → nama penerima masing-masing
{{site_name}}    → nama website
{{unsubscribe_url}} → link unsubscribe (opsional, good practice)
```

---

## Catatan Penting
- Resend free tier: 3000 email/bulan, 100 email/hari. Untuk broadcast ke banyak orang mungkin perlu upgrade plan
- Broadcast hanya ke buyer yang pernah `paid` — bukan semua yang pernah buat order
- Selalu tambahkan unsubscribe link di broadcast email (best practice email marketing)
- HTML editor untuk template bisa pakai CodeMirror dengan syntax highlighting HTML
- Preview template pakai data dummy agar superadmin bisa lihat tampilan sebelum simpan
- Backup template default di kode sebagai fallback kalau template di database corrupt
