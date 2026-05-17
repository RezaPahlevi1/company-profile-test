import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getServices } from "../../../../api/services";
import ServiceCard from "../../../shared/ServiceCard";
import Spinner from "../../../ui/Spinner";

export default function ServicesPreviewBlock({ content, isCustomBg }) {
  const {
    label,
    title,
    subtitle,
    count = 3
  } = content;

  const { data, isLoading } = useQuery({
    queryKey: ["public-services-preview"],
    queryFn: () => getServices(),
  });

  const services = data?.data?.data || [];
  const previewServices = services.slice(0, count);

  return (
    <section className={`py-24 ${isCustomBg ? "bg-transparent" : "bg-white"}`}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            {label && (
              <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wide uppercase mb-4">
                {label}
              </div>
            )}
            
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {title}
              </h2>
            )}
            
            {subtitle && (
              <p className="text-lg text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
          
          <Link 
            to="/services"
            className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors group whitespace-nowrap"
          >
            Lihat Semua Layanan
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <Spinner size="lg" className="py-20" />
        ) : previewServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewServices.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-gray-500">Belum ada layanan yang tersedia.</p>
          </div>
        )}
      </div>
    </section>
  );
}
