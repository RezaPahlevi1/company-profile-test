# 03 — Fitur Promo

## Overview
Superadmin bisa menandai produk atau jasa sebagai promo. Untuk produk, promo dihitung berdasarkan persentase diskon dari harga asli. Untuk jasa, promo hanya berupa label visual karena tidak ada harga.

Jika ada minimal satu produk atau jasa yang sedang promo, halaman publik akan menampilkan popup otomatis saat user pertama kali membuka website di session tersebut.

---

## Perubahan Database

```sql
-- Tambah kolom promo di products
ALTER TABLE products 
ADD COLUMN discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
ADD COLUMN is_promo BOOLEAN DEFAULT false;

-- Tambah kolom promo di services (tanpa harga)
ALTER TABLE services
ADD COLUMN is_promo BOOLEAN DEFAULT false;
```

---

## Logika Perhitungan Harga Promo

```js
// Di frontend — hitung harga setelah diskon
const promoPrice = product.is_promo && product.discount_percent > 0
  ? product.price - (product.price * product.discount_percent / 100)
  : product.price

// Contoh tampilan:
// Harga asli: ~~Rp 150.000~~ (strikethrough)
// Harga promo: Rp 120.000
// Badge: -20%
```

---

## Perubahan Backend

### Update productController
- `getAllProducts` — tambahkan field `discount_percent` dan `is_promo` di response
- `createProduct` — terima field `discount_percent` dan `is_promo`
- `updateProduct` — terima field `discount_percent` dan `is_promo`

### Update serviceController
- `createService` — terima field `is_promo`
- `updateService` — terima field `is_promo`

### Endpoint Baru: Cek Ada Promo
```
GET /api/promos/active → return true/false apakah ada promo aktif
Response: {
  hasPromo: true,
  products: [...produk yang promo],
  services: [...jasa yang promo]
}
```

Endpoint ini dipakai frontend untuk decide apakah tampilkan popup atau tidak.

---

## Perubahan Frontend Admin

### ProductForm
Tambahkan dua field baru saat `is_promo` di-toggle true:
- Toggle `is_promo` (checkbox)
- Input `discount_percent` — hanya muncul kalau `is_promo = true`
- Preview harga setelah diskon secara real-time

```jsx
{isPromo && (
  <div>
    <label>Diskon (%)</label>
    <input type="number" min="1" max="100" {...register('discount_percent')} />
    <p>Harga setelah diskon: Rp {calculatePromoPrice()}</p>
  </div>
)}
```

### ServiceForm
Hanya tambahkan toggle `is_promo` tanpa input diskon.

---

## Perubahan Frontend Publik

### ProductCard
```jsx
{product.is_promo && (
  <div>
    <span className="line-through text-gray-400">
      Rp {formatCurrency(product.price)}
    </span>
    <span className="text-red-600 font-bold">
      Rp {formatCurrency(promoPrice)}
    </span>
    <span className="bg-red-500 text-white px-2 rounded">
      -{product.discount_percent}%
    </span>
  </div>
)}
```

### ServiceCard
```jsx
{service.is_promo && (
  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
    🔥 Promo
  </span>
)}
```

### Popup Promo Otomatis
Komponen `PromoPopup.jsx` ditambahkan di `App.jsx`:

```jsx
// Logic popup
const shouldShowPopup = () => {
  // Cek sessionStorage — kalau sudah pernah tampil di session ini, skip
  const shown = sessionStorage.getItem('promo_popup_shown')
  if (shown) return false
  return true
}

const handleClose = () => {
  sessionStorage.setItem('promo_popup_shown', 'true')
  setIsOpen(false)
}
```

Popup berisi:
- Daftar produk yang sedang promo dengan harga coret dan harga promo
- Daftar jasa yang sedang promo dengan badge promo
- Tombol "Lihat Semua Promo" → link ke `/products` dan `/services`
- Tombol tutup

Popup tidak muncul lagi di session yang sama setelah ditutup. Muncul lagi kalau user buka browser baru atau clear session.

---

## Validasi
- `discount_percent` harus antara 1–100
- Kalau `is_promo` di-set false, `discount_percent` otomatis di-reset ke 0
- Harga checkout tetap pakai `price` asli dari database — diskon dihitung ulang di frontend saat display, tapi saat order dibuat kita perlu kirim harga yang sudah didiskon ke `price_at_purchase`

---

## Catatan Penting
- `price_at_purchase` di `order_items` harus menyimpan harga SETELAH diskon, bukan harga asli
- Backend perlu kalkulasi ulang harga promo saat create order — jangan percaya harga dari frontend
- Kalau promo dicabut setelah order dibuat, `price_at_purchase` tidak berubah (sudah snapshot)
