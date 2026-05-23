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
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      .toISOString();

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
