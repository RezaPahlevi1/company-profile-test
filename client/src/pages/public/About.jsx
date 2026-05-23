import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPageConfig } from "../../api/pageBuilder";
import usePageCheck from "../../hooks/usePageCheck";
import BlockRenderer from "../../components/page-builder/BlockRenderer";
import Spinner from "../../components/ui/Spinner";

export default function About() {
  const { siteSettings, isLoading: isPageLoading } = usePageCheck("about");

  const { data: configData, isLoading: isConfigLoading } = useQuery({
    queryKey: ["public-page-config-about"],
    queryFn: () => getPageConfig("about"),
    staleTime: 1000 * 60 * 5,
  });

  const blocks = configData?.data?.data?.blocks || [];

  if (isPageLoading || isConfigLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 bg-slate-50">
        <p>Halaman sedang dikonfigurasi.</p>
      </div>
    );
  }

  return (
    <main className="pt-16 lg:pt-20">
      {/* ✅ Satu Suspense untuk semua blocks */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            siteSettings={siteSettings}
          />
        ))}
      </Suspense>
    </main>
  );
}