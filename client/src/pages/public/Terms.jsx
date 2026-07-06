import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { getLegalPage } from "../../api/legal";
import Spinner from "../../components/ui/Spinner";
import sanitizeHtml from "../../utils/sanitizeHtml";

const PAGE_KEY = "terms_and_conditions";

export default function Terms() {
  const { data, isLoading } = useQuery({
    queryKey: ["legal-page", PAGE_KEY],
    queryFn: () => getLegalPage(PAGE_KEY),
    staleTime: 1000 * 60 * 5,
  });

  const legalPage = data?.data?.data;
  const hasContent = legalPage?.content && legalPage.content.trim() !== "";

  const formattedDate = legalPage?.updated_at
    ? new Date(legalPage.updated_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (isLoading) return <Spinner size="lg" className="min-h-screen" />;

  return (
    <main className="pt-16 lg:pt-20">
      {/* Header — formal, bukan hero promosional */}
      <section className="section-padding bg-slate-50 border-b border-slate-100">
        <div className="container-base max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 mb-4">
            <ScrollText size={22} className="text-brand-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {legalPage?.title || "Syarat dan Ketentuan"}
          </h1>
          {formattedDate && (
            <p className="text-slate-500 text-sm mt-3">
              Terakhir diperbarui: {formattedDate}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="section-padding bg-white">
        <div className="container-base max-w-3xl mx-auto">
          {hasContent ? (
            <div
              className="prose prose-lg prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-slate-900
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-2xl prose-img:shadow-md
                prose-blockquote:border-brand-500 prose-blockquote:text-slate-500
                prose-strong:text-slate-900
                prose-code:text-brand-600 prose-code:bg-brand-50 prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(legalPage.content),
              }}
            />
          ) : (
            <p className="text-slate-500 text-center py-12">
              Halaman sedang dikonfigurasi.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
