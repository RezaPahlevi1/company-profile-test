import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const testVisitors = [
  { ip: "103.10.20.1", country_code: "ID", country_name: "Indonesia" },
  { ip: "103.10.20.2", country_code: "ID", country_name: "Indonesia" },
  { ip: "103.10.20.3", country_code: "ID", country_name: "Indonesia" },
  { ip: "103.10.20.4", country_code: "ID", country_name: "Indonesia" },
  { ip: "103.10.20.5", country_code: "ID", country_name: "Indonesia" },
  { ip: "116.90.10.1", country_code: "MY", country_name: "Malaysia" },
  { ip: "116.90.10.2", country_code: "MY", country_name: "Malaysia" },
  { ip: "103.252.1.1", country_code: "SG", country_name: "Singapore" },
  { ip: "8.8.8.10", country_code: "US", country_name: "United States" },
  { ip: "8.8.8.11", country_code: "US", country_name: "United States" },
  { ip: "1.1.1.10", country_code: "AU", country_name: "Australia" },
  { ip: "203.0.113.1", country_code: "JP", country_name: "Japan" },
  { ip: "203.0.113.2", country_code: "GB", country_name: "United Kingdom" },
  { ip: "203.0.113.3", country_code: "DE", country_name: "Germany" },
  { ip: "203.0.113.4", country_code: "SA", country_name: "Saudi Arabia" },
];

// Generate kunjungan untuk 30 hari terakhir
const generateVisits = () => {
  const visits = [];
  const now = new Date();

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Random jumlah kunjungan per hari antara 3-15
    const dailyCount = Math.floor(Math.random() * 13) + 3;

    for (let i = 0; i < dailyCount; i++) {
      const visitor =
        testVisitors[Math.floor(Math.random() * testVisitors.length)];

      // Random jam dalam hari itu
      const visitTime = new Date(date);
      visitTime.setHours(Math.floor(Math.random() * 24));
      visitTime.setMinutes(Math.floor(Math.random() * 60));

      const ip_hash = crypto
        .createHash("sha256")
        .update(visitor.ip + "test_secret")
        .digest("hex");

      visits.push({
        ip_hash,
        country_code: visitor.country_code,
        country_name: visitor.country_name,
        visited_at: visitTime.toISOString(),
      });
    }
  }

  return visits;
};

const seed = async () => {
  console.log("Seeding visits...");
  const visits = generateVisits();

  const { error } = await supabase.from("visits").insert(visits);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log(
      `✅ Berhasil insert ${visits.length} visits dari ${new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toLocaleDateString()} sampai hari ini`,
    );
  }
};

seed();
