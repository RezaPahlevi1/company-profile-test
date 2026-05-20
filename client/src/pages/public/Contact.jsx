import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import WhatsAppButton from "../../components/shared/WhatsAppButton";
import usePageCheck from "../../hooks/usePageCheck";
import { getSiteSettings } from "../../api/settings";

const contactSchema = z.object({
  name: z
    .string()
    .min(1, "Nama wajib diisi")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[\w\s\-.,']+$/u, "Nama mengandung karakter tidak valid"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .max(254, "Email terlalu panjang")
    .email("Format email tidak valid"),
  subject: z
    .string()
    .min(1, "Subjek wajib diisi")
    .max(150, "Subjek maksimal 150 karakter"),
  message: z
    .string()
    .min(10, "Pesan minimal 10 karakter")
    .max(2000, "Pesan maksimal 2000 karakter"),
});

const FORMSPREE_URL = `https://formspree.io/f/${import.meta.env.VITE_FORMSPREE_ID}`;

export default function Contact() {
  const { pageInfo, isLoading: isPageLoading } = usePageCheck("contact");

  // Ambil data kontak dari site-settings — cache shared dengan komponen lain
  const { data: siteData, isLoading: isSiteLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const settings = siteData?.data?.data || {};

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data) => {
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail =
          body?.errors?.map((e) => e.message).join(", ") ||
          "Gagal mengirim pesan. Silakan coba lagi.";
        toast.error(detail);
        return;
      }

      toast.success(
        "Pesan Anda telah terkirim! Kami akan segera menghubungi Anda.",
      );
      reset();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  };

  if (isPageLoading) return <div className="min-h-screen"></div>;

  // Bangun info kontak secara dinamis dari site-settings
  // Hanya tampilkan item yang ada datanya
  const contactItems = [
    settings.company_email && {
      icon: Mail,
      label: "Email",
      value: settings.company_email,
      href: `mailto:${settings.company_email}`,
    },
    settings.whatsapp_number && {
      icon: Phone,
      label: "WhatsApp",
      value: `+${settings.whatsapp_number}`,
      href: `https://wa.me/${settings.whatsapp_number}`,
    },
    settings.company_address && {
      icon: MapPin,
      label: "Alamat",
      value: settings.company_address,
      href: null,
    },
  ].filter(Boolean);

  const hasMapsEmbed =
    settings.company_maps_embed_url &&
    settings.company_maps_embed_url.startsWith(
      "https://www.google.com/maps/embed",
    );

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container-base relative z-10 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block text-brand-300 font-semibold text-sm uppercase tracking-widest mb-4"
          >
            {pageInfo?.title || "Hubungi Kami"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white"
          >
            Mari Berdiskusi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg mt-4 max-w-xl mx-auto"
          >
            Kami siap membantu menjawab pertanyaan dan mendiskusikan kebutuhan
            bisnis Anda.
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="container-base">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left — Info + Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Informasi Kontak
                </h2>
                <p className="text-slate-500 mt-2">
                  Atau hubungi kami langsung melalui salah satu channel berikut.
                </p>
              </div>

              {/* Info kontak dinamis dari site-settings */}
              {isSiteLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-white rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : contactItems.length > 0 ? (
                <div className="space-y-4">
                  {contactItems.map((info, i) => (
                    <motion.div
                      key={info.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="card-base p-4 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                        <info.icon size={18} className="text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-medium">
                          {info.label}
                        </p>
                        {info.href ? (
                          <a
                            href={info.href}
                            target={
                              info.href.startsWith("https://wa.me")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              info.href.startsWith("https://wa.me")
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="text-slate-700 font-medium hover:text-brand-600 transition-colors mt-0.5 block break-words"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-slate-700 font-medium mt-0.5 break-words">
                            {info.value}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}

              {/* WhatsApp CTA card */}
              <div className="card-base p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <MessageCircle size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      WhatsApp
                    </p>
                    <p className="text-slate-700 font-medium">
                      Respon lebih cepat
                    </p>
                  </div>
                </div>
                <WhatsAppButton
                  message="Halo, saya ingin berkonsultasi tentang layanan Anda."
                  className="w-full justify-center"
                />
              </div>

              {/* Google Maps Embed — hanya render jika URL valid dari DB */}
              {hasMapsEmbed && (
                <div className="card-base overflow-hidden">
                  <iframe
                    src={settings.company_maps_embed_url}
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-2xl"
                    title="Office Location"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              )}
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card-base p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Kirim Pesan
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name")}
                    placeholder="John Doe"
                    maxLength={100}
                    className="input-base"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="john@example.com"
                    maxLength={254}
                    className="input-base"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Subjek <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("subject")}
                    placeholder="Konsultasi layanan"
                    maxLength={150}
                    className="input-base"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Pesan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("message")}
                    rows={5}
                    placeholder="Ceritakan kebutuhan Anda..."
                    maxLength={2000}
                    className="input-base resize-none"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Kirim Pesan
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
