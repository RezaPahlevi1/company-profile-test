import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Target,
  Eye,
  Award,
  ArrowRight,
  CheckCircle,
  Lightbulb,
  Shield,
  TrendingUp,
} from "lucide-react";
import SectionHeader from "../../components/ui/SectionHeader";
import usePageCheck from "../../hooks/usePageCheck";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

const values = [
  {
    icon: Lightbulb,
    title: "Inovasi",
    description:
      "Kami selalu menghadirkan solusi terbaru dan terdepan untuk kebutuhan bisnis Anda.",
  },
  {
    icon: Shield,
    title: "Integritas",
    description:
      "Kejujuran dan transparansi adalah fondasi dari setiap hubungan kerja kami.",
  },
  {
    icon: Users,
    title: "Kolaborasi",
    description:
      "Kami percaya bahwa hasil terbaik lahir dari kerja sama yang solid antara tim dan klien.",
  },
  {
    icon: TrendingUp,
    title: "Pertumbuhan",
    description:
      "Kesuksesan klien adalah prioritas utama kami dalam setiap proyek yang kami kerjakan.",
  },
];

const team = [
  { name: "Reza Pahlevi", role: "CEO & Founder", initial: "RP" },
  { name: "Reza Pahlevi", role: "Head of Design", initial: "RP" },
  { name: "Reza Pahlevi", role: "Lead Developer", initial: "RP" },
  { name: "Reza Pahlevi", role: "Marketing Director", initial: "RP" },
];

const milestones = [
  {
    year: "2019",
    title: "Perusahaan Didirikan",
    desc: "Memulai perjalanan dengan tim kecil dan visi besar.",
  },
  {
    year: "2020",
    title: "Klien Pertama",
    desc: "Berhasil menyelesaikan 10 proyek pertama dengan hasil memuaskan.",
  },
  {
    year: "2022",
    title: "Ekspansi Tim",
    desc: "Berkembang menjadi 20+ anggota tim profesional.",
  },
  {
    year: "2024",
    title: "50+ Klien",
    desc: "Dipercaya oleh lebih dari 50 klien dari berbagai industri.",
  },
];

export default function About() {
  const { pageInfo, siteSettings, isLoading } = usePageCheck("about");

  if (isLoading) return <div className="min-h-screen"></div>;

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
            transition={{ duration: 0.5 }}
            className="inline-block text-brand-300 font-semibold text-sm uppercase tracking-widest mb-4"
          >
            {pageInfo?.title || "Tentang Kami"}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white"
          >
            Siapa Kami?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-xl mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Kami adalah perusahaan teknologi yang berdedikasi untuk membantu
            bisnis Anda berkembang melalui solusi digital inovatif.
          </motion.p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding bg-white">
        <div className="container-base">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-brand-600 font-semibold text-sm uppercase tracking-widest mb-3">
                Cerita Kami
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                Membangun Masa Depan Digital Bersama
              </h2>
              <p className="text-slate-500 text-lg mt-6 leading-relaxed">
                Didirikan pada tahun 2019, kami telah berkembang dari startup
                kecil menjadi perusahaan teknologi terpercaya yang melayani
                klien dari berbagai industri di seluruh Indonesia.
              </p>
              <p className="text-slate-500 text-lg mt-4 leading-relaxed">
                Dengan tim yang berpengalaman dan passionate, kami berkomitmen
                untuk memberikan solusi digital terbaik yang mendorong
                pertumbuhan bisnis Anda secara signifikan.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Tim profesional berpengalaman 5+ tahun",
                  "Lebih dari 100 proyek berhasil diselesaikan",
                  "Dukungan pelanggan 24/7",
                  "Teknologi terkini dan terpercaya",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="flex items-center gap-3 text-slate-600"
                  >
                    <CheckCircle
                      size={18}
                      className="text-brand-600 shrink-0"
                    />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                {
                  icon: Target,
                  title: "Misi",
                  color: "bg-brand-50",
                  iconColor: "text-brand-600",
                  desc: "Memberikan solusi teknologi inovatif yang memberdayakan bisnis untuk mencapai potensi penuh mereka.",
                },
                {
                  icon: Eye,
                  title: "Visi",
                  color: "bg-purple-50",
                  iconColor: "text-purple-600",
                  desc: "Menjadi mitra teknologi terpercaya nomor satu bagi bisnis di Asia Tenggara.",
                },
                {
                  icon: Award,
                  title: "Nilai",
                  color: "bg-amber-50",
                  iconColor: "text-amber-600",
                  desc: "Integritas, inovasi, dan dedikasi dalam setiap langkah yang kami ambil.",
                },
                {
                  icon: Users,
                  title: "Tim",
                  color: "bg-green-50",
                  iconColor: "text-green-600",
                  desc: "Lebih dari 20 profesional berpengalaman siap membantu bisnis Anda.",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`${card.color} rounded-2xl p-6`}
                >
                  <card.icon size={24} className={`${card.iconColor} mb-3`} />
                  <h3 className="font-bold text-slate-900">{card.title}</h3>
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-slate-50">
        <div className="container-base">
          <SectionHeader
            label="Nilai Kami"
            title="Prinsip yang Kami Pegang"
            subtitle="Nilai-nilai ini menjadi panduan kami dalam setiap keputusan dan tindakan."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="card-base p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-50 rounded-2xl mb-4">
                  <value.icon size={24} className="text-brand-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {value.title}
                </h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-white">
        <div className="container-base">
          <SectionHeader
            label="Perjalanan Kami"
            title="Milestone Perusahaan"
            subtitle="Setiap langkah membawa kami lebih dekat ke visi yang kami impikan."
          />
          <div className="relative mt-16">
            <div className="absolute left-1/2 -translate-x-0.5 top-0 bottom-0 w-0.5 bg-slate-200 hidden lg:block" />
            <div className="space-y-12">
              {milestones.map((item, i) => (
                <motion.div
                  key={item.year}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                    i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div
                    className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}
                  >
                    <div
                      className={`card-base p-6 inline-block max-w-sm ${
                        i % 2 === 0 ? "lg:ml-auto" : ""
                      }`}
                    >
                      <span className="text-brand-600 font-bold text-lg">
                        {item.year}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 text-sm mt-2">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex w-10 h-10 bg-brand-600 rounded-full items-center justify-center shrink-0 z-10">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-slate-50">
        <div className="container-base">
          <SectionHeader
            label="Tim Kami"
            title="Orang-orang di Balik Layar"
            subtitle="Tim profesional kami siap membantu mewujudkan visi bisnis Anda."
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="card-base p-6 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {member.initial}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900">{member.name}</h3>
                <p className="text-brand-600 text-sm mt-1">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-white">
        <div className="container-base">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 text-center"
          >
            <h2 className="text-3xl font-bold text-white">
              Siap Bekerja Sama dengan Kami?
            </h2>
            <p className="text-brand-100 text-lg mt-4 max-w-xl mx-auto">
              Mari diskusikan bagaimana kami bisa membantu bisnis Anda
              berkembang.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl mt-8 hover:bg-brand-50 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
            >
              Hubungi Kami
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
