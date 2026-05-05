# 01 — Multi-Role Admin

## Overview
Sistem admin saat ini hanya punya satu role (superadmin). Kita akan menambahkan dua role baru: `admin_konten` dan `admin_order`. Role lama otomatis menjadi `superadmin`.

---

## Role dan Aksesnya

| Fitur | Superadmin | Admin Konten | Admin Order |
|---|---|---|---|
| Dashboard | ✅ | ❌ | ❌ |
| Products | ✅ | ❌ | ❌ |
| Services | ✅ | ❌ | ❌ |
| Blog (CRUD) | ✅ | ✅ | ❌ |
| Blog (hapus kategori/tag) | ✅ | ❌ | ❌ |
| Orders | ✅ | ❌ | ✅ |
| Settings (Site) | ✅ | ❌ | ❌ |
| Settings (Admins) | ✅ | ❌ | ❌ |

---

## Perubahan Database

```sql
-- Tambah kolom role di tabel admins
ALTER TABLE admins 
ADD COLUMN role VARCHAR(20) DEFAULT 'superadmin' 
CHECK (role IN ('superadmin', 'admin_konten', 'admin_order'));

-- Update admin yang sudah ada menjadi superadmin
UPDATE admins SET role = 'superadmin';
```

---

## Perubahan Backend

### 1. Update JWT Payload
Saat login, tambahkan `role` ke dalam JWT payload:

```js
// authController.js — fungsi login
const payload = {
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role  // ← tambahkan ini
}
```

### 2. Role Middleware Baru
Buat file `server/src/middlewares/roleMiddleware.js`:

```js
// Middleware factory — terima array role yang diizinkan
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const { role } = req.admin

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      })
    }

    next()
  }
}
```

### 3. Update Routes dengan Role Check

```js
// productRoutes.js
router.post('/', authMiddleware, requireRole('superadmin'), ...)
router.put('/:id', authMiddleware, requireRole('superadmin'), ...)
router.delete('/:id', authMiddleware, requireRole('superadmin'), ...)

// blogRoutes.js
router.post('/', authMiddleware, requireRole('superadmin', 'admin_konten'), ...)
router.put('/:id', authMiddleware, requireRole('superadmin', 'admin_konten'), ...)
router.delete('/:id', authMiddleware, requireRole('superadmin', 'admin_konten'), ...)
router.delete('/categories/:id', authMiddleware, requireRole('superadmin'), ...)
router.delete('/tags/:id', authMiddleware, requireRole('superadmin'), ...)

// orderRoutes.js
router.get('/', authMiddleware, requireRole('superadmin', 'admin_order'), ...)
router.get('/:id', authMiddleware, requireRole('superadmin', 'admin_order'), ...)
router.patch('/:id/status', authMiddleware, requireRole('superadmin', 'admin_order'), ...)
```

### 4. Admin CRUD Endpoints (Baru)
Buat `server/src/controllers/adminController.js`:

```
GET    /api/admin/admins          → list semua admin (superadmin only)
POST   /api/admin/admins          → tambah admin baru (superadmin only)
PUT    /api/admin/admins/:id      → edit admin (superadmin only)
DELETE /api/admin/admins/:id      → hapus admin (superadmin only)
```

Catatan: superadmin tidak bisa hapus dirinya sendiri dan tidak bisa hapus superadmin lain.

---

## Perubahan Frontend

### 1. Update authStore
Tambahkan `role` ke dalam store:

```js
// Bisa diakses di semua komponen
const { admin } = useAuthStore()
admin.role // 'superadmin' | 'admin_konten' | 'admin_order'
```

### 2. ProtectedRoute dengan Role
```jsx
// Contoh penggunaan
<Route path="products" element={
  <RoleProtectedRoute allowedRoles={['superadmin']}>
    <ProductList />
  </RoleProtectedRoute>
} />
```

### 3. Update AdminSidebar
Sidebar hanya tampilkan menu yang sesuai role:

```jsx
const menuItems = {
  superadmin: [Dashboard, Products, Services, Blogs, Orders, Settings],
  admin_konten: [Blogs],
  admin_order: [Orders]
}
```

### 4. Halaman Manage Admins (Baru)
Route: `/admin/settings/admins`

Fitur:
- Tabel list semua admin dengan nama, email, role, tanggal dibuat
- Tombol tambah admin baru → modal form (nama, email, password, role)
- Tombol edit admin → modal form (nama, email, role, reset password opsional)
- Tombol hapus admin → confirm modal
- Badge per role dengan warna berbeda

---

## Catatan Penting
- Password admin baru di-hash dengan bcrypt sebelum disimpan
- Superadmin tidak bisa mengubah role dirinya sendiri
- Superadmin tidak bisa menghapus akun dirinya sendiri
- Minimal harus selalu ada satu superadmin aktif di sistem
