import crypto from "crypto";
import geoip from "geoip-lite";
import supabase from "../config/supabase.js";

// Map kode negara ke nama negara
const countryNames = {
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  CA: "Canada",
  BR: "Brazil",
  SA: "Saudi Arabia",
  AE: "United Arab Emirates",
  PH: "Philippines",
  TH: "Thailand",
  VN: "Vietnam",
};

const getCountryName = (code) => countryNames[code] || code;

const isBot = (ua = "") => {
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "headless",
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebookexternalhit",
    "curl",
    "wget",
    "python-requests",
    "axios",
  ];
  return botPatterns.some((p) => ua.toLowerCase().includes(p));
};

// Normalisasi IP — handle semua format IPv4 dan IPv6
// Return null jika IP adalah lokal/tidak valid
const normalizeIp = (raw = "") => {
  if (!raw) return null;

  const ip = raw.trim();

  // IPv4-mapped IPv6: ::ffff:1.2.3.4 atau ::ffff:0:1.2.3.4
  const ipv4MappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (ipv4MappedMatch) return ipv4MappedMatch[1];

  // Loopback dan link-local — tidak bisa di-resolve ke negara
  const isLocal =
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.") ||
    ip.startsWith("fe80:") || // link-local IPv6
    ip.startsWith("fc") || // unique local IPv6
    ip.startsWith("fd"); // unique local IPv6

  if (isLocal) return null;

  return ip;
};

export const trackVisit = async (req, res) => {
  try {
    const ua = req.headers["user-agent"] || "";

    // Skip bot traffic
    if (isBot(ua)) {
      return res.status(200).json({ success: true });
    }

    // Di production dengan trust proxy aktif, req.ip sudah berisi
    // IP asli user dari x-forwarded-for secara otomatis.
    // Di development, fallback ke socket address (akan jadi ::1/lokal)
    const rawIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.socket.remoteAddress ||
      "";

    // Hash IP untuk privacy — selalu dari rawIp agar konsisten
    const ip_hash = crypto
      .createHash("sha256")
      .update(rawIp + process.env.JWT_SECRET)
      .digest("hex");

    // Cek apakah ip_hash yang sama sudah visit dalam 30 menit terakhir
    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000,
    ).toISOString();

    const { data: recentVisit } = await supabase
      .from("visits")
      .select("id")
      .eq("ip_hash", ip_hash)
      .gte("visited_at", thirtyMinutesAgo)
      .limit(1)
      .single();

    if (recentVisit) {
      return res.status(200).json({ success: true });
    }

    // Normalisasi IP sebelum lookup
    // Jika null (lokal/tidak valid), country akan null — kunjungan tetap tercatat
    const cleanIp = normalizeIp(rawIp);
    const geo = cleanIp ? geoip.lookup(cleanIp) : null;
    const country_code = geo?.country || null;
    const country_name = country_code ? getCountryName(country_code) : null;

    await supabase.from("visits").insert([
      {
        ip_hash,
        country_code,
        country_name,
      },
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    // Silent fail — jangan ganggu user
    return res.status(200).json({ success: true });
  }
};

export const getAnalytics = async (req, res) => {
  const { range = "7d" } = req.query;

  const rangeMap = {
    "1d": 1,
    "7d": 7,
    "30d": 30,
    "90d": 90,
  };

  const days = rangeMap[range] || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  try {
    const { data: visits, error } = await supabase
      .from("visits")
      .select("ip_hash, country_code, country_name, visited_at")
      .gte("visited_at", sinceIso)
      .order("visited_at", { ascending: true })
      .limit(10000);

    if (error) throw error;

    // Total visits
    const totalVisits = visits.length;

    // Unique visitors by ip_hash
    const uniqueIps = new Set(visits.map((v) => v.ip_hash));
    const uniqueVisitors = uniqueIps.size;

    // Daily visits
    const dailyMap = {};
    visits.forEach((v) => {
      const date = v.visited_at.split("T")[0];
      if (!dailyMap[date]) dailyMap[date] = { total: 0, ips: new Set() };
      dailyMap[date].total++;
      dailyMap[date].ips.add(v.ip_hash);
    });

    // Fill missing dates dengan 0
    const dailyVisits = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyVisits.push({
        date: dateStr,
        total: dailyMap[dateStr]?.total || 0,
        unique: dailyMap[dateStr]?.ips.size || 0,
      });
    }

    // Weekly summary (hanya untuk 30d dan 90d)
    const weeklyVisits = [];
    if (days >= 14) {
      const weekMap = {};
      visits.forEach((v) => {
        const d = new Date(v.visited_at);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split("T")[0];
        if (!weekMap[weekKey]) weekMap[weekKey] = { total: 0, ips: new Set() };
        weekMap[weekKey].total++;
        weekMap[weekKey].ips.add(v.ip_hash);
      });
      Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([week, data]) => {
          weeklyVisits.push({
            week,
            total: data.total,
            unique: data.ips.size,
          });
        });
    }

    // Monthly summary (hanya untuk 90d)
    const monthlyVisits = [];
    if (days >= 30) {
      const monthMap = {};
      visits.forEach((v) => {
        const monthKey = v.visited_at.substring(0, 7);
        if (!monthMap[monthKey])
          monthMap[monthKey] = { total: 0, ips: new Set() };
        monthMap[monthKey].total++;
        monthMap[monthKey].ips.add(v.ip_hash);
      });
      Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, data]) => {
          monthlyVisits.push({
            month,
            total: data.total,
            unique: data.ips.size,
          });
        });
    }

    // Top countries
    const countryMap = {};
    visits.forEach((v) => {
      if (!v.country_code) return;
      if (!countryMap[v.country_code]) {
        countryMap[v.country_code] = {
          country_code: v.country_code,
          country_name: v.country_name,
          count: 0,
        };
      }
      countryMap[v.country_code].count++;
    });

    const topCountries = Object.values(countryMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((c) => ({
        ...c,
        percentage:
          totalVisits > 0 ? Math.round((c.count / totalVisits) * 100) : 0,
      }));

    return res.status(200).json({
      success: true,
      data: {
        summary: { totalVisits, uniqueVisitors, range },
        dailyVisits,
        weeklyVisits,
        monthlyVisits,
        topCountries,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSalesAnalytics = async (req, res) => {
  const { range = "7d" } = req.query;

  // Konfigurasi range → jumlah hari & granularitas
  const rangeConfig = {
    "1d": { days: 1, granularity: "hour" },
    "7d": { days: 7, granularity: "day" },
    "30d": { days: 30, granularity: "day" },
    "90d": { days: 90, granularity: "month" },
    "1y": { days: 365, granularity: "month" },
  };

  const config = rangeConfig[range] || rangeConfig["7d"];
  const { days, granularity } = config;

  const since = new Date();
  since.setDate(since.getDate() - days);
  // Untuk range 1d, mulai dari awal jam ini dikurangi 23 jam (24 data point)
  if (granularity === "hour") {
    since.setMinutes(0, 0, 0);
  } else {
    since.setHours(0, 0, 0, 0);
  }
  const sinceIso = since.toISOString();

  try {
    // Ambil semua order paid dalam range, beserta order_items-nya
    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        paid_at,
        order_items ( quantity )
      `,
      )
      .eq("status", "paid")
      .gte("paid_at", sinceIso)
      .order("paid_at", { ascending: true });

    if (error) throw error;

    // Hitung summary
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0,
    );
    const totalItemsSold = orders.reduce(
      (sum, o) =>
        sum + (o.order_items || []).reduce((s, i) => s + (i.quantity || 0), 0),
      0,
    );
    const totalPaidOrders = orders.length;

    // Bangun chart data sesuai granularitas
    let chartData = [];

    if (granularity === "hour") {
      // 24 jam terakhir — label "HH:00"
      const hourMap = {};
      orders.forEach((o) => {
        const d = new Date(o.paid_at);
        const key = `${String(d.getHours()).padStart(2, "0")}:00`;
        if (!hourMap[key])
          hourMap[key] = { revenue: 0, items_sold: 0, orders: 0 };
        hourMap[key].revenue += Number(o.total_amount);
        hourMap[key].items_sold += (o.order_items || []).reduce(
          (s, i) => s + (i.quantity || 0),
          0,
        );
        hourMap[key].orders++;
      });

      // Fill 24 jam dari since sampai sekarang
      for (let i = 0; i < 24; i++) {
        const d = new Date(since);
        d.setHours(since.getHours() + i);
        const key = `${String(d.getHours()).padStart(2, "0")}:00`;
        chartData.push({
          label: key,
          revenue: hourMap[key]?.revenue || 0,
          items_sold: hourMap[key]?.items_sold || 0,
          orders: hourMap[key]?.orders || 0,
        });
      }
    } else if (granularity === "day") {
      // Per hari — label "YYYY-MM-DD"
      const dayMap = {};
      orders.forEach((o) => {
        const key = o.paid_at.split("T")[0];
        if (!dayMap[key])
          dayMap[key] = { revenue: 0, items_sold: 0, orders: 0 };
        dayMap[key].revenue += Number(o.total_amount);
        dayMap[key].items_sold += (o.order_items || []).reduce(
          (s, i) => s + (i.quantity || 0),
          0,
        );
        dayMap[key].orders++;
      });

      // Fill missing days dengan 0
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const key = d.toISOString().split("T")[0];
        chartData.push({
          label: key,
          revenue: dayMap[key]?.revenue || 0,
          items_sold: dayMap[key]?.items_sold || 0,
          orders: dayMap[key]?.orders || 0,
        });
      }
    } else if (granularity === "month") {
      // Per bulan — label "YYYY-MM"
      const monthMap = {};
      orders.forEach((o) => {
        const key = o.paid_at.substring(0, 7); // "YYYY-MM"
        if (!monthMap[key])
          monthMap[key] = { revenue: 0, items_sold: 0, orders: 0 };
        monthMap[key].revenue += Number(o.total_amount);
        monthMap[key].items_sold += (o.order_items || []).reduce(
          (s, i) => s + (i.quantity || 0),
          0,
        );
        monthMap[key].orders++;
      });

      // Tentukan bulan pertama sampai bulan sekarang
      const monthCount = days === 90 ? 3 : 12;
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        chartData.push({
          label: key,
          revenue: monthMap[key]?.revenue || 0,
          items_sold: monthMap[key]?.items_sold || 0,
          orders: monthMap[key]?.orders || 0,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalItemsSold,
          totalPaidOrders,
          range,
        },
        chartData,
        granularity,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
