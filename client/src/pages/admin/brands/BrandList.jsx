import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImageOff, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getBrands, deleteBrand } from "../../../api/brands";
import { getSiteSettings, updateSiteSettings } from "../../../api/settings";
import BrandForm from "./BrandForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const ITEMS_PER_PAGE = 12;

export default function BrandList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => getBrands(true),
  });

  // Setting arah animasi marquee — reuse site_settings yang sudah ada
  const { data: siteData } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
  });
  const direction = siteData?.data?.data?.brand_marquee_direction || "left";

  const { mutate: saveDirection, isPending: isSavingDirection } = useMutation({
    mutationFn: updateSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Arah animasi disimpan");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal menyimpan"),
  });

  const handleSetDirection = (dir) => {
    if (dir === direction || isSavingDirection) return;
    saveDirection({ brand_marquee_direction: dir });
  };

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("Brand deleted");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Delete failed");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
  });

  const handleEdit = (brand) => {
    setSelected(brand);
    setShowForm(true);
  };
  const handleClose = () => {
    setSelected(null);
    setShowForm(false);
  };
  const handleDeleteClick = (id, name) =>
    setConfirmModal({ isOpen: true, id, name });
  const handleConfirmDelete = () => remove(confirmModal.id);

  const filtered = useMemo(() => {
    const allBrands = data?.data?.data || [];
    let result = allBrands;
    if (filterStatus !== "all") {
      result = result.filter((b) =>
        filterStatus === "active" ? b.is_active : !b.is_active,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(q));
    }
    return result;
  }, [data, filterStatus, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };
  const handleFilter = (val) => {
    setFilterStatus(val);
    setPage(1);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Brands
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Brand</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari brand..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => handleFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
          >
            <option value="all">Semua</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Arah animasi marquee */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Arah Animasi Marquee
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Arah scroll logo brand di footer
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleSetDirection("left")}
            disabled={isSavingDirection}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              direction === "left"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ← Kiri
          </button>
          <button
            onClick={() => handleSetDirection("right")}
            disabled={isSavingDirection}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
              direction === "right"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Kanan →
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl h-28 lg:h-32 animate-pulse"
            />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-xl p-10 lg:p-12 text-center">
          <p className="text-gray-400 text-sm">
            {search || filterStatus !== "all"
              ? "Tidak ada brand yang sesuai filter."
              : "Belum ada brand. Tambahkan brand pertama Anda."}
          </p>
          {(search || filterStatus !== "all") && (
            <button
              onClick={() => {
                handleSearch("");
                handleFilter("all");
              }}
              className="mt-3 text-blue-600 text-sm hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {paginated.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
              >
                <div className="relative h-20 lg:h-24 bg-gray-50 flex items-center justify-center p-3 shrink-0">
                  {brand.image_url ? (
                    <img
                      src={brand.image_url}
                      alt={brand.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <ImageOff size={20} className="text-gray-300" />
                  )}
                  <span
                    className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      brand.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="p-2 lg:p-3 flex flex-col flex-1">
                  <h3 className="font-medium text-gray-900 text-[11px] lg:text-xs leading-tight line-clamp-1 text-center">
                    {brand.name}
                  </h3>

                  <div className="flex gap-1 mt-auto pt-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="flex-1 flex items-center justify-center border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 py-1.5 rounded-lg transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(brand.id, brand.name)}
                      className="flex-1 flex items-center justify-center border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {filtered.length} brand · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <BrandForm
          brand={selected}
          onClose={handleClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
            handleClose();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Brand"
        message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: "" })}
        isLoading={isDeleting}
      />
    </div>
  );
}
