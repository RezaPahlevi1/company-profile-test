# 04 — Visitor Tracking

## Overview
Sistem tracking pengunjung halaman publik tanpa menggunakan third-party analytics. Data disimpan di database kita sendiri dan ditampilkan di dashboard superadmin. Tracking dilakukan secara anonymous — tidak menyimpan IP mentah untuk menjaga privasi.

---

## Yang Akan Ditrack

| Data | Cara Dapat | Catatan |
|---|---|---|
| Halaman dikunjungi | Dari request path | `/`, `/products`, `/blog`, dll |
| Jumlah kunjungan | Count per hari | Unique dan total |
| Negara pengunjung | IP → geoip-lite | Hanya kode dan nama negara |
| Device type | User-Agent parsing | Mobile / Desktop / Tablet |
| Timestamp | Server time | Untuk grouping per hari/minggu/bulan |
| IP hash | SHA256 dari IP | Untuk hitung unique visitor — IP asli tidak disimpan |

---

## Database

```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page VARCHAR(200) NOT NULL,
  country_code VARCHAR(5),
  country_name VARCHAR(100),
  device_type VARCHAR(20) CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  ip_hash VARCHAR(64),
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query yang sering dipakai
CREATE INDEX idx_visits_visited_at ON visits(visited_at);
CREATE INDEX idx_visits_page ON visits(page);
CREATE INDEX idx_visits_country ON visits(country_code);
```

---

## Backend

### Install Dependencies
```bash
npm install geoip-lite useragent crypto
```

### Endpoint Track Visit
```
POST /api/analytics/track
Body: { page: '/products' }
Headers: User-Agent (otomatis dari browser)
```

Tidak perlu auth — endpoint ini dipanggil dari halaman publik.

**Logika di controller:**
```js
import geoip from 'geoip-lite'
import useragent from 'useragent'
import crypto from 'crypto'

export const trackVisit = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua = req.headers['user-agent']
  const { page } = req.body

  // Hash IP untuk privacy — tidak simpan IP mentah
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex')

  // Detect negara dari IP
  const geo = geoip.lookup(ip)
  const countryCode = geo?.country || 'Unknown'
  const countryName = geo?.country 
    ? getCountryName(geo.country)  // helper function
    : 'Unknown'

  // Detect device type dari User-Agent
  const agent = useragent.parse(ua)
  const deviceType = agent.device.family === 'Other' ? 'desktop' : 
    ['iPad', 'Kindle'].includes(agent.device.family) ? 'tablet' : 'mobile'

  await supabase.from('visits').insert([{
    page,
    country_code: countryCode,
    country_name: countryName,
    device_type: deviceType,
    ip_hash: ipHash,
  }])

  return res.status(200).json({ success: true })
}
```

### Endpoint Analytics untuk Dashboard
```
GET /api/analytics/summary?range=7d   → summary 7 hari terakhir
GET /api/analytics/summary?range=30d  → summary 30 hari terakhir
GET /api/analytics/summary?range=90d  → summary 90 hari terakhir
```

Response:
```json
{
  "totalVisits": 1234,
  "uniqueVisitors": 456,
  "dailyVisits": [
    { "date": "2025-01-01", "count": 45, "unique": 23 },
    ...
  ],
  "topPages": [
    { "page": "/products", "count": 234 },
    ...
  ],
  "topCountries": [
    { "country_code": "ID", "country_name": "Indonesia", "count": 890 },
    { "country_code": "MY", "country_name": "Malaysia", "count": 120 },
    ...
  ],
  "deviceBreakdown": {
    "mobile": 600,
    "desktop": 580,
    "tablet": 54
  }
}
```

---

## Frontend

### Track Visit di Setiap Halaman Publik
Tambahkan di `App.jsx` atau buat custom hook `useTrackVisit`:

```js
// hooks/useTrackVisit.js
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

export const useTrackVisit = () => {
  const location = useLocation()

  useEffect(() => {
    // Jangan track halaman admin
    if (location.pathname.startsWith('/admin')) return

    axiosInstance.post('/analytics/track', {
      page: location.pathname
    }).catch(() => {}) // Silent fail — jangan ganggu user kalau tracking error
  }, [location.pathname])
}
```

### Widget Analytics di Dashboard Superadmin
Ditambahkan ke halaman Dashboard superadmin dengan:

**1. Summary cards (atas)**
- Total kunjungan periode terpilih
- Total unique visitor
- Halaman paling banyak dikunjungi
- Negara terbanyak

**2. Line chart — kunjungan per hari**
Pakai Recharts yang sudah terinstall:
```jsx
<LineChart data={dailyVisits}>
  <XAxis dataKey="date" />
  <YAxis />
  <Line type="monotone" dataKey="count" stroke="#2563eb" name="Total" />
  <Line type="monotone" dataKey="unique" stroke="#10b981" name="Unique" />
</LineChart>
```

**3. Filter waktu**
```jsx
<select onChange={setRange}>
  <option value="7d">7 Hari Terakhir</option>
  <option value="30d">30 Hari Terakhir</option>
  <option value="90d">90 Hari Terakhir</option>
</select>
```

**4. Tabel top negara**
Bendera negara + nama + jumlah kunjungan + persentase dari total

**5. Pie chart device breakdown**
Mobile vs Desktop vs Tablet

---

## Catatan Penting
- geoip-lite pakai database offline — tidak butuh API call eksternal, tidak ada biaya
- Database geoip-lite perlu di-update secara berkala untuk akurasi (setiap beberapa bulan)
- Bot dan crawler sebaiknya di-filter — cek apakah User-Agent mengandung kata "bot", "crawler", "spider"
- Data visits akan terus bertumbuh — pertimbangkan cleanup data lebih dari 1 tahun
- Di localhost/development, IP akan selalu `127.0.0.1` atau `::1` sehingga negara tidak terdeteksi — ini normal
