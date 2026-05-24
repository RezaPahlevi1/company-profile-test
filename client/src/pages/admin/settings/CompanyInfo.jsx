import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings } from "../../../api/settings";
import toast from "react-hot-toast";
import {
  Mail,
  MapPin,
  MessageCircle,
  Save,
  Map,
  Info,
  ExternalLink,
} from "lucide-react";
import Spinner from "../../../components/ui/Spinner";

// Validasi email sederhana di frontend
const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

// Validasi nomor WA — hanya digit, 10-15 karakter
const isValidWa = (val) => /^\d{10,15}$/.test(val);

// Validasi Maps embed URL
const isValidMapsEmbed = (val) =>
  val === "" ||
  val.startsWith("https://www.google.com/maps/embed") ||
  val.startsWith("https://maps.google.com/maps");

export default function CompanyInfo() {
  const queryClient = useQueryClient();

  const { data: siteData, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const settings = siteData?.data?.data || {};

  const [form, setForm] = useState({
    whatsapp_number: "",
    company_email: "",
    company_address: "",
    company_maps_embed_url: "",
  });

  const [errors, setErrors] = useState({});

  // Hydrate form dari settings
  useEffect(() => {
    if (!settings.whatsapp_number && !settings.company_email) return;
    setForm({
      whatsapp_number: settings.whatsapp_number || "",
      company_email: settings.company_email || "",
      company_address: settings.company_address || "",
      company_maps_embed_url: settings.company_maps_embed_url || "",
    });
  }, [siteData]);

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: () => {
      // Invalidate site-settings agar WhatsAppButton dan Contact.jsx
      // langsung pakai data terbaru dari cache
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Company info saved");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to save"),
  });

  const validate = () => {
    const errs = {};

    if (form.company_email && !isValidEmail(form.company_email)) {
      errs.company_email = "Invalid email format";
    }

    if (!form.whatsapp_number) {
      errs.whatsapp_number = "WhatsApp number is required";
    } else if (!isValidWa(form.whatsapp_number)) {
      errs.whatsapp_number = "Must be 10–15 digits, no spaces or symbols";
    }

    if (!isValidMapsEmbed(form.company_maps_embed_url)) {
      errs.company_maps_embed_url =
        'Must be a Google Maps embed URL starting with "https://www.google.com/maps/embed"';
    }

    if (form.company_address.length > 300) {
      errs.company_address = "Address must be under 300 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error saat user mulai mengetik
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleWaChange = (e) => {
    // Hanya izinkan digit
    const onlyDigits = e.target.value.replace(/\D/g, "");
    handleChange("whatsapp_number", onlyDigits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    saveSettings({
      whatsapp_number: form.whatsapp_number,
      company_email: form.company_email,
      company_address: form.company_address,
      company_maps_embed_url: form.company_maps_embed_url,
    });
  };

  // Preview maps — hanya jika URL valid
  const showMapsPreview =
    isValidMapsEmbed(form.company_maps_embed_url) &&
    form.company_maps_embed_url !== "";

  if (isLoading) return <Spinner size="lg" className="py-20" />;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Info</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage contact details shown on the public Contact page.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* WhatsApp Number */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <MessageCircle size={16} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-gray-800">WhatsApp Number</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0 font-mono">
                +
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={form.whatsapp_number}
                onChange={handleWaChange}
                maxLength={15}
                placeholder="628123456789"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                  errors.whatsapp_number ? "border-red-400" : "border-gray-200"
                }`}
              />
            </div>
            {errors.whatsapp_number ? (
              <p className="text-red-500 text-xs mt-1">
                {errors.whatsapp_number}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">
                International format without +. This number is used everywhere —
                WhatsApp buttons, Contact page.
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Mail size={16} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Email</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Email
            </label>
            <input
              type="email"
              value={form.company_email}
              onChange={(e) => handleChange("company_email", e.target.value)}
              placeholder="hello@yourcompany.com"
              maxLength={254}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.company_email ? "border-red-400" : "border-gray-200"
              }`}
            />
            {errors.company_email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.company_email}
              </p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-orange-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Address</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Address
            </label>
            <textarea
              value={form.company_address}
              onChange={(e) => handleChange("company_address", e.target.value)}
              placeholder="Jl. Example No. 123, City, Indonesia"
              maxLength={300}
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.company_address ? "border-red-400" : "border-gray-200"
              }`}
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.company_address.length}/300
            </p>
            {errors.company_address && (
              <p className="text-red-500 text-xs mt-1">
                {errors.company_address}
              </p>
            )}
          </div>
        </div>

        {/* Google Maps */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <Map size={16} className="text-red-600" />
            </div>
            <h2 className="font-semibold text-gray-800">Google Maps</h2>
          </div>

          {/* Instruksi cara dapat embed URL */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-blue-700 text-xs mb-4">
            <Info size={14} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">How to get the embed URL:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
                <li>Open Google Maps and find your location</li>
                <li>
                  Click <strong>Share</strong> → <strong>Embed a map</strong>
                </li>
                <li>
                  Copy only the URL inside{" "}
                  <code className="bg-blue-100 px-1 rounded">src="..."</code>
                </li>
                <li>Paste it below</li>
              </ol>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium mt-1"
              >
                Open Google Maps <ExternalLink size={11} />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Embed URL
            </label>
            <input
              type="url"
              value={form.company_maps_embed_url}
              onChange={(e) =>
                handleChange("company_maps_embed_url", e.target.value)
              }
              placeholder="https://www.google.com/maps/embed?pb=..."
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                errors.company_maps_embed_url
                  ? "border-red-400"
                  : "border-gray-200"
              }`}
            />
            {errors.company_maps_embed_url ? (
              <p className="text-red-500 text-xs mt-1">
                {errors.company_maps_embed_url}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">
                Leave empty to hide the map on the Contact page.
              </p>
            )}
          </div>

          {/* Preview map */}
          {showMapsPreview && (
            <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
              <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 border-b border-gray-100">
                Preview
              </p>
              <iframe
                src={form.company_maps_embed_url}
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Maps Preview"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={15} />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
