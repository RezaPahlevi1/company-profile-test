import supabase from "../config/supabase.js";
import { sendBroadcastEmail } from "../utils/emailService.js";
import uploadToSupabase from "../utils/uploadToSupabase.js";

// ==================== TEMPLATES ====================

export const getTemplates = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("template_key");

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTemplate = async (req, res) => {
  const { key } = req.params;
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", key)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTemplate = async (req, res) => {
  const { key } = req.params;
  const { subject, greeting, body_message, footer_text, header_color } =
    req.body;

  if (header_color && !/^#[0-9A-Fa-f]{6}$/.test(header_color)) {
    return res.status(400).json({
      success: false,
      message: "Invalid color format. Use hex like #2563eb",
    });
  }

  try {
    const { data: existing } = await supabase
      .from("email_templates")
      .select("id")
      .eq("template_key", key)
      .single();

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Template not found" });
    }

    const { data, error } = await supabase
      .from("email_templates")
      .update({
        ...(subject && { subject }),
        // ✅ greeting boleh kosong string
        ...(greeting !== undefined && { greeting }),
        ...(body_message !== undefined && { body_message }),
        ...(footer_text !== undefined && { footer_text }),
        ...(header_color && { header_color }),
      })
      .eq("template_key", key)
      .select()
      .single();

    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Template updated", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadBroadcastImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const url = await uploadToSupabase(
      req.file.buffer,
      req.file.mimetype,
      "broadcast"
    );

    return res.status(200).json({ success: true, data: { url } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const resetTemplate = async (req, res) => {
  const { key } = req.params;

  const defaults = {
    order_created: {
      subject: "✅ Order {{order_number}} Berhasil Dibuat",
      greeting: "Halo {{buyer_name}},",
      body_message:
        "Terima kasih telah melakukan pemesanan di {{site_name}}. Segera selesaikan pembayaran Anda sebelum batas waktu yang ditentukan. Simpan nomor order Anda untuk melacak status pembayaran.",
      footer_text:
        "Email ini dikirim otomatis oleh sistem {{site_name}}. Jika ada pertanyaan, hubungi kami.",
      header_color: "#2563eb",
    },
    payment_success: {
      subject: "🎉 Pembayaran {{order_number}} Berhasil Dikonfirmasi",
      greeting: "Halo {{buyer_name}},",
      body_message:
        "Pembayaran Anda telah kami terima dan dikonfirmasi. Estimasi penyelesaian: {{delivery_estimation}}. Terima kasih telah berbelanja di {{site_name}}.",
      footer_text:
        "Email ini dikirim otomatis oleh sistem {{site_name}}. Jika ada pertanyaan, hubungi kami.",
      header_color: "#059669",
    },
    // ✅ Default untuk broadcast template
    broadcast: {
      subject: "",
      greeting: "",
      body_message: "",
      footer_text:
        "Email ini dikirim oleh {{site_name}}. Anda menerima email ini karena pernah melakukan pemesanan di website kami.",
      header_color: "#2563eb",
    },
  };

  if (!defaults[key]) {
    return res
      .status(404)
      .json({ success: false, message: "Template not found" });
  }

  try {
    const { data, error } = await supabase
      .from("email_templates")
      .update(defaults[key])
      .eq("template_key", key)
      .select()
      .single();

    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Template reset to default", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== BROADCASTS ====================

export const getBroadcasts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_broadcasts")
      .select(
        `
        id, subject, status, recipient_count,
        scheduled_at, sent_at, created_at,
        admins ( name, email )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createBroadcast = async (req, res) => {
  const { subject, body_message, scheduled_at, recipient_emails } = req.body;

  if (!subject || !body_message) {
    return res.status(400).json({
      success: false,
      message: "Subject and body message are required",
    });
  }

  if (scheduled_at) {
    const schedTime = new Date(scheduled_at);
    if (isNaN(schedTime.getTime()) || schedTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be a valid future date",
      });
    }
  }

  try {
    const { data, error } = await supabase
      .from("email_broadcasts")
      .insert([
        {
          subject,
          body_message,
          status: scheduled_at ? "scheduled" : "draft",
          scheduled_at: scheduled_at || null,
          // ✅ simpan recipient_emails — null = semua
          recipient_emails: recipient_emails?.length ? recipient_emails : null,
          created_by: req.admin.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return res
      .status(201)
      .json({ success: true, message: "Broadcast created", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBroadcast = async (req, res) => {
  const { id } = req.params;
  const { subject, body_message, scheduled_at, recipient_emails } = req.body;

  try {
    const { data: existing } = await supabase
      .from("email_broadcasts")
      .select("status")
      .eq("id", id)
      .single();

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Broadcast not found" });
    }

    if (["sent", "sending"].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit a broadcast that is already sent or sending",
      });
    }

    if (scheduled_at) {
      const schedTime = new Date(scheduled_at);
      if (isNaN(schedTime.getTime()) || schedTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be a valid future date",
        });
      }
    }

    const { data, error } = await supabase
      .from("email_broadcasts")
      .update({
        ...(subject && { subject }),
        ...(body_message !== undefined && { body_message }),
        scheduled_at: scheduled_at || null,
        status: scheduled_at ? "scheduled" : "draft",
        // ✅ update recipient_emails
        recipient_emails: recipient_emails?.length ? recipient_emails : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Broadcast updated", data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBroadcast = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: existing } = await supabase
      .from("email_broadcasts")
      .select("status")
      .eq("id", id)
      .single();

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Broadcast not found" });
    }

    if (["sent", "sending"].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a sent or sending broadcast",
      });
    }

    const { error } = await supabase
      .from("email_broadcasts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return res
      .status(200)
      .json({ success: true, message: "Broadcast deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Ganti getRecipientPreview → getRecipients (return semua data, bukan hanya preview)
export const getRecipients = async (req, res) => {
  try {
    // ✅ Semua order tanpa filter status
    const { data: orders, error } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name");

    if (error) throw error;

    const unique = [...new Map(orders.map((o) => [o.buyer_email, o])).values()];

    return res.status(200).json({
      success: true,
      data: {
        count: unique.length,
        recipients: unique.map((r) => ({
          email: r.buyer_email,
          name: r.buyer_name,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ sendBroadcast terima selected_emails (opsional) untuk kirim ke subset
export const sendBroadcast = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: broadcast, error: broadcastError } = await supabase
      .from("email_broadcasts")
      .select("*")
      .eq("id", id)
      .single();

    if (broadcastError || !broadcast) {
      return res
        .status(404)
        .json({ success: false, message: "Broadcast not found" });
    }

    if (broadcast.status === "sent") {
      return res
        .status(400)
        .json({ success: false, message: "Broadcast already sent" });
    }

    if (broadcast.status === "sending") {
      return res
        .status(400)
        .json({ success: false, message: "Broadcast is already being sent" });
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("buyer_email, buyer_name");

    if (ordersError) throw ordersError;

    const allRecipients = [
      ...new Map(orders.map((o) => [o.buyer_email, o])).values(),
    ];

    // ✅ Gunakan recipient_emails dari database (bukan dari request body)
    const recipients = broadcast.recipient_emails?.length
      ? allRecipients.filter((r) =>
          broadcast.recipient_emails.includes(r.buyer_email),
        )
      : allRecipients;

    if (!recipients.length) {
      return res.status(400).json({
        success: false,
        message: "No eligible recipients found",
      });
    }

    await supabase
      .from("email_broadcasts")
      .update({ status: "sending" })
      .eq("id", id);

    res.status(200).json({
      success: true,
      message: `Sending broadcast to ${recipients.length} recipients...`,
      data: { recipientCount: recipients.length },
    });

    const { sent, failed } = await sendBroadcastEmail(broadcast, recipients);

    await supabase
      .from("email_broadcasts")
      .update({
        status: failed > 0 && sent === 0 ? "failed" : "sent",
        recipient_count: sent,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    console.log(`Broadcast ${id} done: ${sent} sent, ${failed} failed`);
  } catch (err) {
    await supabase
      .from("email_broadcasts")
      .update({ status: "failed" })
      .eq("id", id);
    console.error("sendBroadcast error:", err);
  }
};
