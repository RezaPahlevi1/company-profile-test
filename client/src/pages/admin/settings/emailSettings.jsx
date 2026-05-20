import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
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
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
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
  uploadBroadcastImage,
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
  broadcast: ["{{buyer_name}}", "{{site_name}}"],
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
// BROADCAST MENU BAR — dengan upload image ke Supabase
// ============================================================
const BroadcastMenuBar = ({ editor, onImageUpload, isUploadingImage }) => {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL:", prev || "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const buttons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      icon: <Bold size={14} />,
      title: "Bold",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      icon: <Italic size={14} />,
      title: "Italic",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      icon: <Heading2 size={14} />,
      title: "H2",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
      icon: <Heading3 size={14} />,
      title: "H3",
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      icon: <List size={14} />,
      title: "Bullet",
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      icon: <ListOrdered size={14} />,
      title: "Ordered",
    },
    {
      action: setLink,
      active: editor.isActive("link"),
      icon: <LinkIcon size={14} />,
      title: "Link",
    },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {buttons.map(({ action, active, icon, title }) => (
        <button
          key={title}
          type="button"
          onClick={action}
          title={title}
          className={`p-2 rounded text-sm transition-colors ${
            active
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          {icon}
        </button>
      ))}

      {/* Upload image — terpisah karena async */}
      <label
        title="Upload Gambar"
        className={`p-2 rounded text-sm transition-colors cursor-pointer ${
          isUploadingImage
            ? "opacity-50 cursor-not-allowed"
            : "text-gray-600 hover:bg-gray-200"
        }`}
      >
        {isUploadingImage ? (
          <Upload size={14} className="animate-pulse" />
        ) : (
          <ImageIcon size={14} />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isUploadingImage}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file);
            // reset input agar file yang sama bisa diupload lagi
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
};

// ============================================================
// TEMPLATE EDITOR — support broadcast template (greeting boleh kosong)
// ============================================================
const TemplateEditor = ({
  template,
  onSave,
  onReset,
  isSaving,
  isResetting,
}) => {
  const isBroadcast = template.template_key === "broadcast";

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

      {/* Subject — hanya untuk non-broadcast */}
      {!isBroadcast && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Subject Email
          </label>
          <input
            value={form.subject}
            onChange={(e) =>
              setForm((f) => ({ ...f, subject: e.target.value }))
            }
            className="input-base"
            placeholder="Subject email..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Preview: <span className="text-gray-600">{previewSubject}</span>
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Salam Pembuka{" "}
          {isBroadcast && (
            <span className="text-gray-400 font-normal">(opsional)</span>
          )}
        </label>
        <input
          value={form.greeting}
          onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
          className="input-base"
          placeholder={
            isBroadcast
              ? "Halo {{buyer_name}}, (kosongkan jika tidak perlu)"
              : "Halo {{buyer_name}},"
          }
        />
      </div>

      {/* Body message — hanya untuk non-broadcast (broadcast pakai editor) */}
      {!isBroadcast && (
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
      )}

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
  const allSelected = selectedEmails === null;

  const filtered = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => onChange(null);

  const toggleOne = (email) => {
    if (allSelected) {
      onChange(recipients.map((r) => r.email).filter((e) => e !== email));
    } else {
      if (selectedEmails.includes(email)) {
        const next = selectedEmails.filter((e) => e !== email);
        onChange(next.length === 0 ? [] : next);
      } else {
        const next = [...selectedEmails, email];
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
// BROADCAST FORM — dengan Tiptap editor
// ============================================================
const getMinScheduleTime = () =>
  new Date(Date.now() + 60000).toISOString().slice(0, 16);
const BroadcastForm = ({
  broadcast,
  onSave,
  onCancel,
  isSaving,
  recipients,
}) => {
  const [subject, setSubject] = useState(broadcast?.subject || "");
  const [selectedEmails, setSelectedEmails] = useState(null);
  const [scheduleOpts, setScheduleOpts] = useState({
    use: Boolean(broadcast?.scheduled_at),
    value: broadcast?.scheduled_at
      ? new Date(broadcast.scheduled_at).toISOString().slice(0, 16)
      : "",
    min: getMinScheduleTime(),
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          style: "max-width:100%;height:auto;border-radius:8px;",
        },
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "Tulis isi email broadcast di sini...",
      }),
    ],
    content: broadcast?.body_message || "",
  });

  const handleImageUpload = useCallback(
    async (file) => {
      if (!editor) return;

      const MAX_MB = 5;
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`Ukuran gambar maksimal ${MAX_MB}MB`);
        return;
      }

      setIsUploadingImage(true);
      try {
        const res = await uploadBroadcastImage(file);
        const url = res.data?.data?.url;
        if (!url) throw new Error("URL tidak ditemukan");
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("Gambar berhasil diunggah");
      } catch (err) {
        toast.error(err.response?.data?.message || "Gagal mengunggah gambar");
      } finally {
        setIsUploadingImage(false);
      }
    },
    [editor],
  );

  const selectedCount =
    selectedEmails === null ? recipients.length : selectedEmails.length;

  const handleSave = () => {
    const bodyHtml = editor?.getHTML() || "";
    if (!subject.trim()) {
      toast.error("Subject tidak boleh kosong");
      return;
    }
    if (!bodyHtml || bodyHtml === "<p></p>") {
      toast.error("Isi email tidak boleh kosong");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Pilih minimal satu penerima");
      return;
    }

    onSave({
      subject: subject.trim(),
      body_message: bodyHtml,
      scheduled_at:
        scheduleOpts.use && scheduleOpts.value
          ? new Date(scheduleOpts.value).toISOString()
          : null,
      recipient_emails: selectedEmails,
    });
  };

  return (
    <div className="space-y-5">
      {/* Info penerima */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-amber-600" />
          <p className="text-sm font-medium text-amber-700">
            {selectedCount} dari {recipients.length} penerima dipilih
          </p>
        </div>
      </div>

      {/* Recipient selector */}
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

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Subject Email <span className="text-red-500">*</span>
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input-base"
          placeholder="Promo spesial untuk Anda!"
        />
      </div>

      {/* Tiptap Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Isi Email <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <BroadcastMenuBar
            editor={editor}
            onImageUpload={handleImageUpload}
            isUploadingImage={isUploadingImage}
          />
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-4 min-h-50 focus:outline-none"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Gunakan toolbar untuk format teks dan upload gambar langsung ke email.
        </p>
      </div>

      {/* Schedule */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scheduleOpts.use}
            onChange={(e) =>
              setScheduleOpts({
                use: e.target.checked,
                value: "",
                min: new Date(Date.now() + 60000).toISOString().slice(0, 16), // ← refresh saat toggle
              })
            }
            className="w-4 h-4 accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">
            <Calendar size={14} className="inline mr-1.5" />
            Jadwalkan pengiriman
          </span>
        </label>
        {scheduleOpts.use && (
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Tanggal & waktu pengiriman
            </label>
            <input
              type="datetime-local"
              value={scheduleOpts.value}
              onChange={(e) =>
                setScheduleOpts((s) => ({ ...s, value: e.target.value }))
              }
              min={scheduleOpts.min}
              className="input-base"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || isUploadingImage}
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
          {/* Template selector — sekarang 3 tab */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { key: "order_created", label: "Order Dibuat" },
              { key: "payment_success", label: "Pembayaran Sukses" },
              { key: "broadcast", label: "Broadcast" },
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
                                onClick={() => setConfirmSend(bc)}
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
        message={`Broadcast "${confirmSend?.subject}" akan dikirim ke ${recipientCount} penerima. Tindakan ini tidak bisa dibatalkan setelah dimulai.`}
        confirmLabel="Ya, Kirim Sekarang"
        variant="primary"
        onConfirm={() => doSendBroadcast(confirmSend?.id)}
        onCancel={() => setConfirmSend(null)}
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
