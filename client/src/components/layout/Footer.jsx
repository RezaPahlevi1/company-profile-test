import { useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, getPageSettings } from "../../api/settings";

// Halaman yang tidak ditampilkan di footer quick links
const EXCLUDED_FROM_FOOTER = ["home", "order-track"];

// Komponen video dengan facade pattern:
// Tampilkan thumbnail dulu, iframe dimuat hanya setelah user klik
const YouTubeFacade = ({ videoId }) => {
  const [playing, setPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full rounded-xl"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="relative w-full group"
      aria-label="Play video"
    >
      {/* Aspect ratio 16:9 */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover rounded-xl"
          loading="lazy"
        />
        {/* Overlay gelap */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors rounded-xl" />
        {/* Tombol play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-lg">
            <Play
              size={20}
              className="text-slate-900 ml-0.5"
              fill="currentColor"
            />
          </div>
        </div>
      </div>
    </button>
  );
};

export default function Footer() {
  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    staleTime: 1000 * 60 * 10,
  });

  const { data: pagesData } = useQuery({
    queryKey: ["page-settings"],
    queryFn: getPageSettings,
    staleTime: 1000 * 60 * 10,
  });

  const settings = siteData?.data?.data || {};
  const pages = pagesData?.data?.data || [];

  const siteName = settings.site_name || "CompanyName";
  const footerTagline =
    settings.footer_tagline ||
    "Solusi digital terpercaya untuk transformasi bisnis Anda.";
  const footerCtaTitle = settings.footer_cta_title || "Siap Berdiskusi?";
  const footerCtaBody =
    settings.footer_cta_body ||
    "Kami siap membantu menjawab pertanyaan dan kebutuhan bisnis Anda.";
  const footerVideoId = settings.footer_video_id || "";
  const showFooterVideo =
    settings.show_footer_video !== "false" && footerVideoId !== "";

  // Quick links — hanya halaman aktif, exclude home dan order-track
  const quickLinks = pages
    .filter((p) => p.is_active && !EXCLUDED_FROM_FOOTER.includes(p.page_key))
    .map((p) => ({
      label: p.navbar_label,
      to: `/${p.page_key}`,
    }));

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="container-base section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Kolom 1 — Brand + tagline + video */}
          <div className="md:col-span-1">
            <Link to="/" className="font-bold text-xl text-white">
              <span className="text-brand-400">{siteName}</span>
            </Link>
            <p className="text-sm leading-relaxed mt-3 mb-5">{footerTagline}</p>

            {/* Video facade — hanya render jika aktif dan video ID tersedia */}
            {showFooterVideo && (
              <div className="w-full max-w-xs">
                <YouTubeFacade videoId={footerVideoId} />
              </div>
            )}
          </div>

          {/* Kolom 2 — Quick links dinamis dari page_settings */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigasi</h4>
            {quickLinks.length > 0 ? (
              <ul className="space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">—</p>
            )}
          </div>

          {/* Kolom 3 — CTA */}
          <div>
            <h4 className="text-white font-semibold mb-4">{footerCtaTitle}</h4>
            <p className="text-sm leading-relaxed mb-5">{footerCtaBody}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors duration-200"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <Link
            to="/terms"
            className="hover:text-white transition-colors duration-200"
          >
            Syarat dan Ketentuan
          </Link>
        </div>
      </div>
    </footer>
  );
}
