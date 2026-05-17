import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function CtaBlock({ content, isCustomBg }) {
  const {
    heading,
    subheading,
    cta_primary_label,
    cta_primary_url,
    cta_secondary_label,
    cta_secondary_url,
  } = content;

  return (
    <section className={`py-24 relative overflow-hidden ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="absolute inset-0 z-0 bg-blue-600">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-500 rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 md:p-16 shadow-2xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            {heading}
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {subheading}
          </p>
          
          {(cta_primary_label || cta_secondary_label) && (
            <div className="flex flex-wrap justify-center gap-4">
              {cta_primary_label && cta_primary_url && (
                <Link
                  to={cta_primary_url}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all group"
                >
                  {cta_primary_label}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              {cta_secondary_label && cta_secondary_url && (
                <Link
                  to={cta_secondary_url}
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all"
                >
                  {cta_secondary_label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
