import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "../../api/settings";

const footerLinks = [
  {
    title: "Navigasi",
    links: [
      { label: "Home", to: "/" },
      { label: "About", to: "/about" },
      { label: "Products", to: "/products" },
      { label: "Services", to: "/services" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Layanan",
    links: [
      { label: "Web Development", to: "/services" },
      { label: "Digital Marketing", to: "/services" },
      { label: "UI/UX Design", to: "/services" },
      { label: "Konsultasi IT", to: "/services" },
    ],
  },
];

export default function Footer() {
  // ✅ Ambil site_name dari site settings — cache shared dengan Navbar
  // queryKey ["site-settings"] sama dengan Navbar, jadi tidak ada fetch tambahan
  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const settings = siteData?.data?.data || {};
  const siteName = settings.site_name || "CompanyName";

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="container-base section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-bold text-xl text-white">
              {/* ✅ site_name dinamis, ganti hardcode "RezaPahlevi .Co" */}
              <span className="text-brand-400">{siteName}</span>
            </Link>
            <p className="text-sm leading-relaxed mt-4">
              Solusi digital terpercaya untuk transformasi bisnis Anda di era
              modern.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href={`https://wa.me/${import.meta.env.VITE_WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-slate-800 hover:bg-green-600 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-white font-semibold mb-4">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Mail size={15} className="shrink-0 mt-0.5 text-brand-400" />
                <span>email@company.com</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone size={15} className="shrink-0 mt-0.5 text-brand-400" />
                <span>+62 895 1207 6445</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin size={15} className="shrink-0 mt-0.5 text-brand-400" />
                <span>
                  Jl. Anggrek Merah No. 123,
                  <br />
                  Tanjungpinang, Indonesia
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          {/* ✅ Copyright juga pakai site_name dinamis */}
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
