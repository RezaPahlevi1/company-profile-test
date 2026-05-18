import cron from "node-cron";
import supabase from "../config/supabase.js";
import { sendBroadcastEmail } from "./emailService.js";

// ✅ Prevent overlapping cron jobs
let isProcessing = false;

// ======================================================
// Process Scheduled Broadcasts
// ======================================================

async function processScheduledBroadcasts() {
  try {
    const now = new Date().toISOString();

    // ✅ Ambil semua broadcast scheduled yang waktunya sudah lewat
    const { data: broadcasts, error } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (error) {
      console.error("[Scheduler] Failed to fetch broadcasts:", error.message);
      return;
    }

    if (!broadcasts?.length) {
      console.log("[Scheduler] No scheduled broadcasts");
      return;
    }

    console.log(
      `[Scheduler] Found ${broadcasts.length} broadcast(s) to process`,
    );

    // ✅ Process satu per satu agar tidak overload
    for (const broadcast of broadcasts) {
      await processSingleBroadcast(broadcast);
    }
  } catch (err) {
    console.error("[Scheduler] Unexpected error:", err.message);
  }
}

// ======================================================
// Process Single Broadcast
// ======================================================

async function processSingleBroadcast(broadcast) {
  try {
    console.log(`[Scheduler] Processing broadcast ${broadcast.id}`);

    // ✅ Lock broadcast supaya tidak double-send
    const { data: lockedData, error: lockError } = await supabase
      .from("email_broadcasts")
      .update({ status: "sending" })
      .eq("id", broadcast.id)
      .eq("status", "scheduled")
      .select();

    // Kalau tidak ada row yang ke-update → berarti sudah diproses
    if (!lockedData?.length) {
      console.log(
        `[Scheduler] Broadcast ${broadcast.id} already locked/skipped`,
      );
      return;
    }

    if (lockError) {
      console.error(
        `[Scheduler] Failed to lock broadcast ${broadcast.id}:`,
        lockError.message,
      );
      return;
    }

    // ======================================================
    // Get Paid Orders
    // ======================================================

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name")
      .eq("status", "paid");

    if (ordersError) {
      throw ordersError;
    }

    // ✅ Remove duplicate emails
    const allRecipients = [
      ...new Map(orders.map((o) => [o.buyer_email, o])).values(),
    ];

    // ======================================================
    // Filter Recipients
    // ======================================================

    const recipients = broadcast.recipient_emails?.length
      ? allRecipients.filter((r) =>
          broadcast.recipient_emails.includes(r.buyer_email),
        )
      : allRecipients;

    // ======================================================
    // No Recipients
    // ======================================================

    if (!recipients.length) {
      await supabase
        .from("email_broadcasts")
        .update({
          status: "failed",
          sent_at: new Date().toISOString(),
        })
        .eq("id", broadcast.id);

      console.warn(
        `[Scheduler] Broadcast ${broadcast.id}: no eligible recipients`,
      );

      return;
    }

    console.log(
      `[Scheduler] Sending broadcast ${broadcast.id} to ${recipients.length} recipient(s)`,
    );

    // ======================================================
    // Send Emails
    // ======================================================

    const { sent, failed } = await sendBroadcastEmail(broadcast, recipients);

    // ======================================================
    // Update Status
    // ======================================================

    await supabase
      .from("email_broadcasts")
      .update({
        status: failed > 0 && sent === 0 ? "failed" : "sent",
        recipient_count: sent,
        sent_at: new Date().toISOString(),
      })
      .eq("id", broadcast.id);

    console.log(
      `[Scheduler] Broadcast ${broadcast.id} completed → ${sent} sent, ${failed} failed`,
    );
  } catch (err) {
    console.error(`[Scheduler] Broadcast ${broadcast.id} error:`, err.message);

    // ✅ Reset ke failed supaya tidak stuck di "sending"
    await supabase
      .from("email_broadcasts")
      .update({
        status: "failed",
      })
      .eq("id", broadcast.id);
  }
}

// ======================================================
// Recovery Stuck Broadcasts
// ======================================================

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

    if (!stuck?.length) {
      console.log("[Scheduler] No stuck broadcasts found");
      return;
    }

    const ids = stuck.map((b) => b.id);

    const { error: resetError } = await supabase
      .from("email_broadcasts")
      .update({
        status: "scheduled",
      })
      .in("id", ids);

    if (resetError) {
      console.error("[Scheduler] Recovery reset failed:", resetError.message);
      return;
    }

    console.log(`[Scheduler] Recovered ${ids.length} stuck broadcast(s)`);
  } catch (err) {
    console.error("[Scheduler] Recovery unexpected error:", err.message);
  }
}

// ======================================================
// Start Scheduler
// ======================================================

export async function startScheduler() {
  // ✅ Recovery dulu sebelum scheduler jalan
  await recoverStuckBroadcasts();

  // ✅ Cron tiap 1 menit
  cron.schedule("* * * * *", async () => {
    // Prevent overlap
    if (isProcessing) {
      console.log("[Scheduler] Previous job still running, skipping...");
      return;
    }

    try {
      isProcessing = true;

      console.log(
        `[Scheduler] Running scheduled job at ${new Date().toISOString()}`,
      );

      await processScheduledBroadcasts();
    } catch (err) {
      console.error("[Scheduler] Cron execution failed:", err.message);
    } finally {
      isProcessing = false;
    }
  });

  console.log("[Scheduler] Broadcast scheduler started");
}
