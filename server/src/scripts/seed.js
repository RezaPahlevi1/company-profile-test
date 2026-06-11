/**
 * ============================================================
 * SEED SCRIPT — Production Database Setup
 * ============================================================
 * Jalankan SEKALI saat setup database baru.
 * Script ini idempotent — aman dijalankan ulang tanpa duplikasi.
 *
 * Usage:
 *   node src/scripts/seed.js
 *
 * Pastikan .env sudah diisi dengan kredensial Supabase yang benar
 * sebelum menjalankan script ini.
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

// ============================================================
// SUPABASE CLIENT
// Pakai service role key agar bisa bypass RLS
// ============================================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ============================================================
// HELPER — prompt input dari terminal
// ============================================================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

const promptHidden = (question) =>
  new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    let input = "";
    process.stdin.on("data", function handler(char) {
      char = char.toString();
      if (char === "\n" || char === "\r" || char === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener("data", handler);
        process.stdout.write("\n");
        resolve(input);
      } else if (char === "\u0003") {
        process.exit();
      } else if (char === "\u007f") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          process.stdout.write(question + "*".repeat(input.length));
        }
      } else {
        input += char;
        process.stdout.write("*");
      }
    });
  });

// ============================================================
// HELPER — log dengan warna
// ============================================================
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  ok: (msg) => console.log(`\x1b[32m[OK]\x1b[0m ${msg}`),
  skip: (msg) => console.log(`\x1b[33m[SKIP]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  section: (msg) =>
    console.log(
      `\n\x1b[35m${"─".repeat(50)}\n  ${msg}\n${"─".repeat(50)}\x1b[0m`,
    ),
};

// ============================================================
// STEP 1 — SUPERADMIN
// ============================================================
async function seedAdmin(name, email, password) {
  log.section("Step 1: Superadmin");

  // Cek apakah sudah ada superadmin
  const { data: existing } = await supabase
    .from("admins")
    .select("id, email")
    .eq("email", email)
    .single();

  if (existing) {
    log.skip(`Admin dengan email "${email}" sudah ada. Dilewati.`);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("admins").insert({
    name,
    email,
    password_hash,
    role: "superadmin",
  });

  if (error) throw new Error(`Gagal membuat superadmin: ${error.message}`);
  log.ok(`Superadmin "${name}" (${email}) berhasil dibuat.`);
}

// ============================================================
// STEP 2 — SITE SETTINGS
// ============================================================
async function seedSiteSettings(siteName) {
  log.section("Step 2: Site Settings");

  const defaults = [
    { key: "site_name", value: siteName },
    { key: "site_description", value: "" },
    { key: "show_site_name", value: "true" },
    { key: "navbar_logo_url", value: "" },
    { key: "whatsapp_number", value: "" },
    { key: "show_whatsapp", value: "false" },
    { key: "footer_tagline", value: "" },
    { key: "footer_cta_title", value: "" },
    { key: "footer_cta_body", value: "" },
    { key: "footer_video_id", value: "" },
    { key: "show_footer_video", value: "false" },
    { key: "company_email", value: "" },
    { key: "company_address", value: "" },
    { key: "company_maps_embed_url", value: "" },
    { key: "bank_account_info", value: "" },
    { key: "delivery_estimation", value: "" },
    { key: "payment_expiry_minutes", value: "1440" },
    { key: "manual_payment_expiry_minutes", value: "1440" },
    { key: "manual_payment_verification_hours", value: "1x24 jam kerja" },
    { key: "show_promo", value: "false" },
    { key: "promo_title", value: "" },
    { key: "promo_description", value: "" },
    { key: "promo_banner_url", value: "" },
    { key: "promo_starts_at", value: "" },
    { key: "promo_ends_at", value: "" },
  ];

  // Cek key mana yang sudah ada
  const { data: existing } = await supabase.from("site_settings").select("key");

  const existingKeys = new Set((existing || []).map((r) => r.key));

  const toInsert = defaults.filter((d) => !existingKeys.has(d.key));

  if (!toInsert.length) {
    log.skip("Semua site_settings sudah ada. Dilewati.");
    return;
  }

  const { error } = await supabase.from("site_settings").insert(toInsert);
  if (error) throw new Error(`Gagal insert site_settings: ${error.message}`);
  log.ok(`${toInsert.length} site_settings berhasil dibuat.`);
}

// ============================================================
// STEP 3 — PAGE SETTINGS
// ============================================================
async function seedPageSettings() {
  log.section("Step 3: Page Settings");

  const pages = [
    {
      page_key: "home",
      title: "Home",
      navbar_label: "Home",
      is_active: true,
      sort_order: 1,
    },
    {
      page_key: "about",
      title: "About",
      navbar_label: "About",
      is_active: true,
      sort_order: 2,
    },
    {
      page_key: "services",
      title: "Services",
      navbar_label: "Services",
      is_active: true,
      sort_order: 3,
    },
    {
      page_key: "products",
      title: "Products",
      navbar_label: "Products",
      is_active: true,
      sort_order: 4,
    },
    {
      page_key: "blog",
      title: "Blog",
      navbar_label: "Blog",
      is_active: true,
      sort_order: 5,
    },
    {
      page_key: "contact",
      title: "Contact",
      navbar_label: "Contact",
      is_active: true,
      sort_order: 6,
    },
    {
      page_key: "order-track",
      title: "Track Order",
      navbar_label: "Track Order",
      is_active: true,
      sort_order: 7,
    },
  ];

  const { data: existing } = await supabase
    .from("page_settings")
    .select("page_key");

  const existingKeys = new Set((existing || []).map((r) => r.page_key));
  const toInsert = pages.filter((p) => !existingKeys.has(p.page_key));

  if (!toInsert.length) {
    log.skip("Semua page_settings sudah ada. Dilewati.");
    return;
  }

  const { error } = await supabase.from("page_settings").insert(toInsert);
  if (error) throw new Error(`Gagal insert page_settings: ${error.message}`);
  log.ok(`${toInsert.length} page_settings berhasil dibuat.`);
}

// ============================================================
// STEP 4 — EMAIL TEMPLATES
// ============================================================
async function seedEmailTemplates(siteName) {
  log.section("Step 4: Email Templates");

  const templates = [
    {
      template_key: "order_created",
      subject: "Pesanan Diterima — {{order_number}}",
      greeting: "Halo, {{buyer_name}}!",
      body_message:
        "Terima kasih telah berbelanja di {{site_name}}. Pesanan Anda telah kami terima dan sedang menunggu pembayaran. Segera selesaikan pembayaran agar pesanan Anda dapat segera diproses.",
      footer_text:
        "© {{site_name}}. Email ini dikirim otomatis, mohon tidak membalas email ini.",
      header_color: "#2563eb",
    },
    {
      template_key: "payment_success",
      subject: "Pembayaran Berhasil — {{order_number}}",
      greeting: "Halo, {{buyer_name}}!",
      body_message:
        "Pembayaran Anda untuk pesanan {{order_number}} telah berhasil dikonfirmasi. Terima kasih telah berbelanja di {{site_name}}. Kami akan segera memproses pesanan Anda.",
      footer_text:
        "© {{site_name}}. Email ini dikirim otomatis, mohon tidak membalas email ini.",
      header_color: "#059669",
    },
    {
      template_key: "broadcast",
      subject: "Informasi Terbaru dari {{site_name}}",
      greeting: "Halo, {{buyer_name}}!",
      body_message: "",
      footer_text:
        "© {{site_name}}. Anda menerima email ini karena pernah bertransaksi dengan kami.",
      header_color: "#2563eb",
    },
  ];

  const { data: existing } = await supabase
    .from("email_templates")
    .select("template_key");

  const existingKeys = new Set((existing || []).map((r) => r.template_key));
  const toInsert = templates.filter((t) => !existingKeys.has(t.template_key));

  if (!toInsert.length) {
    log.skip("Semua email_templates sudah ada. Dilewati.");
    return;
  }

  const { error } = await supabase.from("email_templates").insert(toInsert);
  if (error) throw new Error(`Gagal insert email_templates: ${error.message}`);
  log.ok(`${toInsert.length} email_templates berhasil dibuat.`);
}

// ============================================================
// STEP 5 — PAGE CONFIGS
// ============================================================
async function seedPageConfigs() {
  log.section("Step 5: Page Configs");

  const pages = ["home", "about"];

  const { data: existing } = await supabase
    .from("page_configs")
    .select("page_key");

  const existingKeys = new Set((existing || []).map((r) => r.page_key));
  const toInsert = pages
    .filter((p) => !existingKeys.has(p))
    .map((page_key) => ({ page_key, blocks: [] }));

  if (!toInsert.length) {
    log.skip("Semua page_configs sudah ada. Dilewati.");
    return;
  }

  const { error } = await supabase.from("page_configs").insert(toInsert);
  if (error) throw new Error(`Gagal insert page_configs: ${error.message}`);
  log.ok(`${toInsert.length} page_configs berhasil dibuat.`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("\n\x1b[1m\x1b[35m");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║        DATABASE SEED — PRODUCTION        ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("\x1b[0m");

  // Verifikasi koneksi Supabase
  log.info("Memverifikasi koneksi ke Supabase...");
  const { error: pingError } = await supabase
    .from("admins")
    .select("id")
    .limit(1);
  if (pingError) {
    log.error(`Gagal terhubung ke Supabase: ${pingError.message}`);
    log.error(
      "Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env sudah benar.",
    );
    process.exit(1);
  }
  log.ok("Koneksi ke Supabase berhasil.");

  // ── Kumpulkan input dari user ──────────────────────────────
  console.log("\n\x1b[33mIsi data berikut untuk setup awal:\x1b[0m\n");

  const siteName = (await prompt("  Nama perusahaan/website : ")).trim();
  if (!siteName) {
    log.error("Nama perusahaan tidak boleh kosong.");
    process.exit(1);
  }

  const adminName = (await prompt("  Nama superadmin         : ")).trim();
  if (!adminName) {
    log.error("Nama superadmin tidak boleh kosong.");
    process.exit(1);
  }

  const adminEmail = (await prompt("  Email superadmin        : "))
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    log.error("Format email tidak valid.");
    process.exit(1);
  }

  const adminPassword = await promptHidden("  Password superadmin     : ");
  if (adminPassword.length < 8) {
    log.error("Password minimal 8 karakter.");
    process.exit(1);
  }

  const adminPasswordConfirm = await promptHidden(
    "  Konfirmasi password     : ",
  );
  if (adminPassword !== adminPasswordConfirm) {
    log.error("Password tidak cocok.");
    process.exit(1);
  }

  rl.close();

  console.log("");

  // ── Jalankan semua step ────────────────────────────────────
  try {
    await seedAdmin(adminName, adminEmail, adminPassword);
    await seedSiteSettings(siteName);
    await seedPageSettings();
    await seedEmailTemplates(siteName);
    await seedPageConfigs();

    console.log("\n\x1b[32m");
    console.log("╔══════════════════════════════════════════╗");
    console.log("║           SEED SELESAI ✓                 ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log("\x1b[0m");
    console.log("Database siap digunakan. Langkah selanjutnya:");
    console.log(
      "  1. Pastikan semua environment variable production sudah diisi",
    );
    console.log("  2. Deploy server dan client");
    console.log(
      "  3. Login ke CMS dengan email dan password yang baru dibuat\n",
    );
  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
