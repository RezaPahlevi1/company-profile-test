import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Mail,
  RefreshCw,
  Save,
  Send,
  Plus,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getTemplates,
  updateEmailTemplate,
  resetEmailTemplate,
  getBroadcasts,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  getRecipients,
  sendBroadcast,
} from "../../../api/email";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const AVAILABLE_VARIABLES = {
  order_created: [
    "{{buyer_name}}",
    "{{order_number}}",
    "{{total_amount}}",
    "{{order_date}}",
    "{{site_name}}",
    "{{track_url}}",
  ],
  payment_success: [
    "{{buyer_name}}",
    "{{order_number}}",
    "{{total_amount}}",
    "{{payment_method}}",
    "{{paid_at}}",
    "{{delivery_estimation}}",
    "{{site_name}}",
    "{{track_url}}",
  ],
};

const statusConfig = {
  draft: { label: "Draft", icon: FileText, color: "bg-gray-100 text-gray-600" },
  scheduled: {
    label: "Terjadwal",
    icon: Calendar,
    color: "bg-blue-100 text-blue-600",
  },
  sending: {
    label: "Mengirim...",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-600",
  },
  sent: {
    label: "Terkirim",
    icon: CheckCircle,
    color: "bg-green-100 text-green-700",
  },
  failed: {
    label: "Gagal",
    icon: AlertCircle,
    color: "bg-red-100 text-red-600",
  },
};

// ============================================================
// TEMPLATE EDITOR
// ============================================================
const TemplateEditor = ({
  template,
  onSave,
  onReset,
  isSaving,
  isResetting,
}) => {
  const [form, setForm] = useState({
    subject: template.subject || "",
    greeting: template.greeting || "",
    body_message: template.body_message || "",
    footer_text: template.footer_text || "",
    header_color: template.header_color || "#2563eb",
  });

  const variables = AVAILABLE_VARIABLES[template.template_key] || [];

  const copyVariable = (variable) => {
    navigator.clipboard.writeText(variable);
    toast.success(`${variable} disalin`);
  };

  const previewSubject = form.subject
    .replace("{{buyer_name}}", "John Doe")
    .replace("{{order_number}}", "ORD-20250501-ABC123")
    .replace("{{site_name}}", "CompanyName");

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700 mb-2">
          Variabel yang bisa dipakai — klik untuk salin:
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map((v) => (
            <button
              key={v}
              onClick={() => copyVariable(v)}
              className="bg-white border border-blue-200 text-blue-600 text-xs px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors font-mono"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Subject Email
        </label>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="input-base"
          placeholder="Subject email..."
        />
        <p className="text-xs text-gray-400 mt-1">
          Preview: <span className="text-gray-600">{previewSubject}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Salam Pembuka
        </label>
        <input
          value={form.greeting}
          onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
          className="input-base"
          placeholder="Halo {{buyer_name}},"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Pesan Utama
        </label>
        <textarea
          value={form.body_message}
          onChange={(e) =>
            setForm((f) => ({ ...f, body_message: e.target.value }))
          }
          rows={4}
          className="input-base resize-none"
          placeholder="Isi pesan email..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Footer
        </label>
        <textarea
          value={form.footer_text}
          onChange={(e) =>
            setForm((f) => ({ ...f, footer_text: e.target.value }))
          }
          rows={2}
          className="input-base resize-none"
          placeholder="Teks footer email..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Warna Header
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.header_color}
            onChange={(e) =>
              setForm((f) => ({ ...f, header_color: e.target.value }))
            }
            className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            value={form.header_color}
            onChange={(e) =>
              setForm((f) => ({ ...f, header_color: e.target.value }))
            }
            className="input-base w-36 font-mono text-sm"
            placeholder="#2563eb"
          />
          <div
            className="flex-1 h-10 rounded-lg border border-gray-200"
            style={{ backgroundColor: form.header_color }}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onReset()}
          disabled={isResetting}
          className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} />
          Reset Default
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="btn-primary flex-1 justify-center"
        >
          <Save size={15} />
          {isSaving ? "Menyimpan..." : "Simpan Template"}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// RECIPIENT SELECTOR
// ============================================================
const RecipientSelector = ({ recipients, selectedEmails, onChange }) => {
  const [search, setSearch] = useState("");
  const allSelected = selectedEmails === null; // null = semua

  const filtered = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => {
    onChange(null); // null = kirim ke semua
  };

  const toggleOne = (email) => {
    if (allSelected) {
      // Dari "semua" → unselect satu = pilih semua kecuali ini
      onChange(recipients.map((r) => r.email).filter((e) => e !== email));
    } else {
      if (selectedEmails.includes(email)) {
        const next = selectedEmails.filter((e) => e !== email);
        onChange(next.length === 0 ? [] : next);
      } else {
        const next = [...selectedEmails, email];
        // Kalau sudah pilih semua, kembalikan ke null
        onChange(next.length === recipients.length ? null : next);
      }
    }
  };

  const isSelected = (email) =>
    allSelected || (selectedEmails && selectedEmails.includes(email));

  const selectedCount = allSelected
    ? recipients.length
    : selectedEmails?.length || 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
        >
          {allSelected ? (
            <CheckSquare size={16} className="text-brand-600" />
          ) : (
            <Square size={16} className="text-gray-400" />
          )}
          Semua ({recipients.length})
        </button>
        <span className="text-xs text-gray-500">{selectedCount} dipilih</span>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Search size={13} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="bg-transparent text-sm outline-none flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">
            Tidak ada hasil
          </p>
        ) : (
          filtered.map((r) => (
            <button
              key={r.email}
              onClick={() => toggleOne(r.email)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              {isSelected(r.email) ? (
                <CheckSquare size={15} className="text-brand-600 shrink-0" />
              ) : (
                <Square size={15} className="text-gray-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {r.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{r.email}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================
// BROADCAST FORM
// ============================================================
const BroadcastForm = ({
  broadcast,
  onSave,
  onCancel,
  isSaving,
  recipients,
}) => {
  const [form, setForm] = useState({
    subject: broadcast?.subject || "",
    body_message: broadcast?.body_message || "",
    scheduled_at: broadcast?.scheduled_at
      ? new Date(broadcast.scheduled_at).toISOString().slice(0, 16)
      : "",
    useSchedule: Boolean(broadcast?.scheduled_at),
  });

  // null = semua, array = subset
  const [selectedEmails, setSelectedEmails] = useState(null);

  const broadcastVariables = ["{{buyer_name}}", "{{site_name}}"];

  const copyVariable = (v) => {
    navigator.clipboard.writeText(v);
    toast.success(`${v} disalin`);
  };

  const selectedCount =
    selectedEmails === null ? recipients.length : selectedEmails.length;

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users size={14} className="text-amber-600" />
          <p className="text-sm font-medium text-amber-700">
            {selectedCount} dari {recipients.length} penerima dipilih
          </p>
        </div>
        <p className="text-xs text-amber-600">
          Variabel tersedia — klik untuk salin:
        </p>
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {broadcastVariables.map((v) => (
            <button
              key={v}
              onClick={() => copyVariable(v)}
              className="bg-white border border-amber-200 text-amber-600 text-xs px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors font-mono"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ Recipient selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Pilih Penerima
        </label>
        <RecipientSelector
          recipients={recipients}
          selectedEmails={selectedEmails}
          onChange={setSelectedEmails}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Subject Email <span className="text-red-500">*</span>
        </label>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="input-base"
          placeholder="Promo spesial untuk Anda!"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Isi Pesan <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.body_message}
          onChange={(e) =>
            setForm((f) => ({ ...f, body_message: e.target.value }))
          }
          rows={6}
          className="input-base resize-none"
          placeholder="Halo {{buyer_name}}, kami ingin menyampaikan..."
        />
      </div>

      <div className="border border-gray-100 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.useSchedule}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                useSchedule: e.target.checked,
                scheduled_at: "",
              }))
            }
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            <Calendar size={14} className="inline mr-1.5" />
            Jadwalkan pengiriman
          </span>
        </label>
        {form.useSchedule && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Tanggal & waktu pengiriman
            </label>
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduled_at: e.target.value }))
              }
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="input-base"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() =>
            onSave({
              subject: form.subject,
              body_message: form.body_message,
              scheduled_at:
                form.useSchedule && form.scheduled_at
                  ? new Date(form.scheduled_at).toISOString()
                  : null,
              // ✅ null = semua, array = subset — disimpan ke database
              recipient_emails: selectedEmails,
            })
          }
          disabled={
            isSaving ||
            !form.subject ||
            !form.body_message ||
            selectedCount === 0
          }
          className="btn-primary flex-1 justify-center"
        >
          <Save size={15} />
          {isSaving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function EmailSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("templates");
  const [activeTemplate, setActiveTemplate] = useState("order_created");
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [confirmSend, setConfirmSend] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  // ✅ State selected_emails untuk confirm send
  const [pendingSendEmails, setPendingSendEmails] = useState(null);

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: getTemplates,
  });

  const { data: broadcastsData, isLoading: broadcastsLoading } = useQuery({
    queryKey: ["email-broadcasts"],
    queryFn: getBroadcasts,
    enabled: activeTab === "broadcasts",
  });

  const { data: recipientsData } = useQuery({
    queryKey: ["broadcast-recipients"],
    queryFn: getRecipients,
    enabled: activeTab === "broadcasts",
  });

  const templates = templatesData?.data?.data || [];
  const broadcasts = broadcastsData?.data?.data || [];
  const recipients = recipientsData?.data?.data?.recipients || [];
  const recipientCount = recipientsData?.data?.data?.count || 0;
  const currentTemplate = templates.find(
    (t) => t.template_key === activeTemplate,
  );

  const { mutate: saveTemplate, isPending: isSavingTemplate } = useMutation({
    mutationFn: (data) => updateEmailTemplate(activeTemplate, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template disimpan");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal menyimpan"),
  });

  const { mutate: doResetTemplate, isPending: isResettingTemplate } =
    useMutation({
      mutationFn: () => resetEmailTemplate(activeTemplate),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["email-templates"] });
        toast.success("Template direset ke default");
      },
      onError: () => toast.error("Gagal mereset template"),
    });

  const { mutate: doCreateBroadcast, isPending: isCreatingBroadcast } =
    useMutation({
      mutationFn: createBroadcast,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["email-broadcasts"] });
        setShowBroadcastForm(false);
        toast.success("Broadcast disimpan");
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Gagal menyimpan"),
    });

  const { mutate: doUpdateBroadcast, isPending: isUpdatingBroadcast } =
    useMutation({
      mutationFn: ({ id, data }) => updateBroadcast(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["email-broadcasts"] });
        setEditingBroadcast(null);
        toast.success("Broadcast diperbarui");
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Gagal memperbarui"),
    });

  const { mutate: doDeleteBroadcast, isPending: isDeletingBroadcast } =
    useMutation({
      mutationFn: deleteBroadcast,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["email-broadcasts"] });
        setConfirmDelete(null);
        toast.success("Broadcast dihapus");
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Gagal menghapus"),
    });

  // ✅ Simpel — tidak perlu selected_emails di request body
  const { mutate: doSendBroadcast, isPending: isSendingBroadcast } =
    useMutation({
      mutationFn: (id) => sendBroadcast(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["email-broadcasts"] });
        setConfirmSend(null);
        toast.success("Broadcast sedang dikirim di background");
      },
      onError: (err) =>
        toast.error(err.response?.data?.message || "Gagal mengirim"),
    });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: "templates", label: "Template Email", icon: Mail },
          { key: "broadcasts", label: "Broadcast", icon: Send },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-brand-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TEMPLATES TAB */}
      {activeTab === "templates" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex gap-2 mb-6">
            {[
              { key: "order_created", label: "Order Dibuat" },
              { key: "payment_success", label: "Pembayaran Sukses" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTemplate(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTemplate === t.key
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {templatesLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : currentTemplate ? (
            <TemplateEditor
              key={activeTemplate}
              template={currentTemplate}
              onSave={saveTemplate}
              onReset={doResetTemplate}
              isSaving={isSavingTemplate}
              isResetting={isResettingTemplate}
            />
          ) : null}
        </motion.div>
      )}

      {/* BROADCASTS TAB */}
      {activeTab === "broadcasts" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {showBroadcastForm || editingBroadcast ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">
                {editingBroadcast ? "Edit Broadcast" : "Buat Broadcast Baru"}
              </h2>
              <BroadcastForm
                broadcast={editingBroadcast}
                recipients={recipients}
                onSave={(data) => {
                  if (editingBroadcast) {
                    doUpdateBroadcast({ id: editingBroadcast.id, data });
                  } else {
                    doCreateBroadcast(data);
                  }
                }}
                onCancel={() => {
                  setShowBroadcastForm(false);
                  setEditingBroadcast(null);
                }}
                isSaving={isCreatingBroadcast || isUpdatingBroadcast}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={15} />
                  <span>{recipientCount} penerima tersedia</span>
                </div>
                <button
                  onClick={() => setShowBroadcastForm(true)}
                  className="btn-primary"
                >
                  <Plus size={15} />
                  Broadcast Baru
                </button>
              </div>

              {broadcastsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl h-20 animate-pulse"
                    />
                  ))}
                </div>
              ) : broadcasts.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Send size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">Belum ada broadcast.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {broadcasts.map((bc) => {
                    const status =
                      statusConfig[bc.status] || statusConfig.draft;
                    const canEdit = !["sent", "sending"].includes(bc.status);
                    const canSend = ["draft", "scheduled"].includes(bc.status);

                    return (
                      <div
                        key={bc.id}
                        className="bg-white rounded-xl shadow-sm p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {bc.subject}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                              >
                                <status.icon size={11} />
                                {status.label}
                              </span>
                              {bc.recipient_count > 0 && (
                                <span className="text-xs text-gray-400">
                                  {bc.recipient_count} terkirim
                                </span>
                              )}
                              {bc.scheduled_at && bc.status === "scheduled" && (
                                <span className="text-xs text-blue-600">
                                  📅{" "}
                                  {new Date(bc.scheduled_at).toLocaleString(
                                    "id-ID",
                                  )}
                                </span>
                              )}
                              {bc.sent_at && (
                                <span className="text-xs text-gray-400">
                                  {new Date(bc.sent_at).toLocaleString("id-ID")}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {canSend && (
                              <button
                                onClick={() => {
                                  setConfirmSend(bc);
                                  setPendingSendEmails(null); // default = semua
                                }}
                                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                              >
                                <Send size={12} />
                                Kirim
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => setEditingBroadcast(bc)}
                                className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                              >
                                <FileText size={15} />
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => setConfirmDelete(bc)}
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Confirm Send */}
      <ConfirmModal
        isOpen={Boolean(confirmSend)}
        title="Kirim Broadcast"
        message={`Broadcast "${confirmSend?.subject}" akan dikirim ke ${
          pendingSendEmails === null
            ? recipientCount
            : pendingSendEmails?.length || 0
        } penerima. Tindakan ini tidak bisa dibatalkan setelah dimulai.`}
        confirmLabel="Ya, Kirim Sekarang"
        variant="primary"
        onConfirm={() => doSendBroadcast(confirmSend?.id)}
        onCancel={() => {
          setConfirmSend(null);
          setPendingSendEmails(null);
        }}
        isLoading={isSendingBroadcast}
      />

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        title="Hapus Broadcast"
        message={`Hapus broadcast "${confirmDelete?.subject}"?`}
        confirmLabel="Hapus"
        variant="danger"
        onConfirm={() => doDeleteBroadcast(confirmDelete?.id)}
        onCancel={() => setConfirmDelete(null)}
        isLoading={isDeletingBroadcast}
      />
    </div>
  );
}
