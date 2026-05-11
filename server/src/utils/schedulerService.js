import cron from "node-cron";
import supabase from "../config/supabase.js";
import { sendBroadcastEmail } from "./emailService.js";

// Cek dan kirim broadcast yang sudah waktunya
async function processScheduledBroadcasts() {
  try {
    const now = new Date().toISOString();

    // Ambil semua broadcast yang scheduled dan waktunya sudah lewat
    const { data: broadcasts, error } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (error) {
      console.error("[Scheduler] Failed to fetch broadcasts:", error.message);
      return;
    }

    if (!broadcasts?.length) return;

    console.log(`[Scheduler] Found ${broadcasts.length} broadcast(s) to send`);

    for (const broadcast of broadcasts) {
      await processSingleBroadcast(broadcast);
    }
  } catch (err) {
    console.error("[Scheduler] Unexpected error:", err.message);
  }
}

async function processSingleBroadcast(broadcast) {
  try {
    // ✅ Tandai "sending" dulu agar tidak double-send jika cron overlap
    const { error: lockError } = await supabase
      .from("email_broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcast.id)
      .eq("status", "scheduled"); // ✅ guard: hanya update jika masih "scheduled"

    if (lockError) {
      console.error(
        `[Scheduler] Failed to lock broadcast ${broadcast.id}:`,
        lockError.message,
      );
      return;
    }

    // Ambil semua buyer yang pernah paid
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name")
      .eq("status", "paid");

    if (ordersError) throw ordersError;

    const allRecipients = [
      ...new Map(orders.map((o) => [o.buyer_email, o])).values(),
    ];

    // ✅ Gunakan recipient_emails dari database — null = kirim ke semua
    const recipients = broadcast.recipient_emails?.length
      ? allRecipients.filter((r) =>
          broadcast.recipient_emails.includes(r.buyer_email),
        )
      : allRecipients;

    if (!recipients.length) {
      await supabase
        .from("email_broadcasts")
        .update({ status: "failed", sent_at: new Date().toISOString() })
        .eq("id", broadcast.id);

      console.warn(
        `[Scheduler] Broadcast ${broadcast.id}: no eligible recipients`,
      );
      return;
    }

    const { sent, failed } = await sendBroadcastEmail(broadcast, recipients);

    await supabase
      .from("email_broadcasts")
      .update({
        status: failed > 0 && sent === 0 ? "failed" : "sent",
        recipient_count: sent,
        sent_at: new Date().toISOString(),
      })
      .eq("id", broadcast.id);

    console.log(
      `[Scheduler] Broadcast ${broadcast.id} done: ${sent} sent, ${failed} failed`,
    );
  } catch (err) {
    console.error(`[Scheduler] Broadcast ${broadcast.id} error:`, err.message);

    // Tandai failed agar tidak stuck di "sending"
    await supabase
      .from("email_broadcasts")
      .update({ status: "failed" })
      .eq("id", broadcast.id);
  }
}

// ✅ Recovery — reset broadcast yang stuck di "sending" saat server crash/restart
async function recoverStuckBroadcasts() {
  try {
    const { data: stuck, error } = await supabase
      .from("email_broadcasts")
      .select("id")
      .eq("status", "sending");

    if (error) {
      console.error("[Scheduler] Recovery check failed:", error.message);
      return;
    }

    if (!stuck?.length) return;

    const ids = stuck.map((b) => b.id);

    const { error: resetError } = await supabase
      .from("email_broadcasts")
      .update({ status: "scheduled" })
      .in("id", ids);

    if (resetError) {
      console.error("[Scheduler] Recovery reset failed:", resetError.message);
      return;
    }

    console.log(
      `[Scheduler] Recovered ${ids.length} stuck broadcast(s) → reset to "scheduled"`,
    );
  } catch (err) {
    console.error("[Scheduler] Recovery unexpected error:", err.message);
  }
}

// ✅ startScheduler jadi async agar recovery selesai sebelum cron pertama jalan
export async function startScheduler() {
  await recoverStuckBroadcasts();

  cron.schedule("* * * * *", () => {
    processScheduledBroadcasts();
  });

  console.log("[Scheduler] Broadcast scheduler started");
}
