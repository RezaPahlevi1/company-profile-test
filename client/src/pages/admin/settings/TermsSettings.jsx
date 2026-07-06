import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollText, Save } from "lucide-react";
import toast from "react-hot-toast";
import { getLegalPage, updateLegalPage } from "../../../api/legal";
import RichTextEditor from "../../../components/page-builder/editors/shared/RichTextEditor";
import Spinner from "../../../components/ui/Spinner";

const PAGE_KEY = "terms_and_conditions";

export default function TermsSettings() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["legal-page", PAGE_KEY],
    queryFn: () => getLegalPage(PAGE_KEY),
    staleTime: 1000 * 60 * 5,
  });

  const legalPage = data?.data?.data;

  // Sinkronisasi form dari data server, sekali saat data datang/berubah
  useEffect(() => {
    if (legalPage) {
      setTitle(legalPage.title || "Syarat dan Ketentuan");
      setContent(legalPage.content || "");
    }
  }, [legalPage]);

  const { mutate: saveLegalPage, isPending } = useMutation({
    mutationFn: () => updateLegalPage(PAGE_KEY, { title, content }),
    onSuccess: () => {
      toast.success("Syarat dan Ketentuan berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: ["legal-page", PAGE_KEY] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Gagal menyimpan Syarat dan Ketentuan",
      );
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan konten wajib diisi");
      return;
    }
    saveLegalPage();
  };

  if (isLoading) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <ScrollText size={22} className="text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          Syarat dan Ketentuan
        </h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Halaman ini tampil publik di{" "}
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
          /terms
        </code>
        , diakses lewat footer dan halaman checkout.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Judul Halaman
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className="input-base"
            placeholder="Syarat dan Ketentuan"
          />
        </div>

        <RichTextEditor
          content={{ html: content }}
          onChange={(updated) => setContent(updated.html)}
        />

        <div className="flex items-center justify-between pt-2">
          {legalPage?.updated_at ? (
            <p className="text-xs text-gray-400">
              Terakhir diperbarui:{" "}
              {new Date(legalPage.updated_at).toLocaleString("id-ID")}
            </p>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={16} />
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
