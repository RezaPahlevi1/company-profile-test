import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import toast from "react-hot-toast";
import WhatsAppButton from "../../components/shared/WhatsAppButton";

const contactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  subject: z.string().min(1, "Subjek wajib diisi"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "email@company.com",
    href: "mailto:email@company.com",
  },
  {
    icon: Phone,
    label: "Telepon",
    value: "+62 895 1207 6445",
    href: "tel:+6289512076445",
  },
  {
    icon: MapPin,
    label: "Alamat",
    value: "Jl. Anggrek Merah No. 123, Tanjungpinang, Indonesia",
    href: null,
  },
];

export default function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (data) => {
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Contact form:", data);
    toast.success(
      "Pesan Anda telah terkirim! Kami akan segera menghubungi Anda.",
    );
    reset();
  };

  return (
    <main className="pt-16 lg:pt-20">
      {/* Hero */}
      <section className="section-padding bg-linear-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden">
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
            Hubungi Kami
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

              <div className="space-y-4">
                {contactInfo.map((info, i) => (
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
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        {info.label}
                      </p>
                      {info.href ? (
                        <a
                          href={info.href}
                          className="text-slate-700 font-medium hover:text-brand-600 transition-colors mt-0.5 block"
                        >
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-slate-700 font-medium mt-0.5">
                          {info.value}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

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

              {/* Google Maps Embed */}
              <div className="card-base overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d352.60866577987593!2d104.46904864188758!3d0.9131131888289215!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sid!2sid!4v1777718795119!5m2!1sid!2sid"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-2xl"
                  title="Office Location"
                />
              </div>
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
