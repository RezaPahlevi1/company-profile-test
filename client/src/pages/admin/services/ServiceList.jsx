import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImageOff, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getServices, deleteService } from "../../../api/services";
import ServiceForm from "./ServiceForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const ITEMS_PER_PAGE = 9;

export default function ServiceList() {
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
    queryKey: ["admin-services"],
    queryFn: () => getServices(true),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
      toast.success("Service deleted");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Delete failed");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
  });

  const handleEdit = (service) => {
    setSelected(service);
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
    const allServices = data?.data?.data || [];
    let result = allServices;
    if (filterStatus !== "all") {
      result = result.filter((s) =>
        filterStatus === "active" ? s.is_active : !s.is_active,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q),
      );
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
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Services
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Service</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari layanan..."
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

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl h-52 lg:h-64 animate-pulse"
            />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-white rounded-xl p-10 lg:p-12 text-center">
          <p className="text-gray-400 text-sm">
            {search || filterStatus !== "all"
              ? "Tidak ada layanan yang sesuai filter."
              : "No services yet. Add your first service."}
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {paginated.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="relative h-32 sm:h-40 lg:h-48 bg-gray-100 flex items-center justify-center shrink-0">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff size={24} className="text-gray-300" />
                  )}

                  {/* Badge promo */}
                  {service.is_promo && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                      🔥 Promo
                    </div>
                  )}

                  {/* Status badge */}
                  <span
                    className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      service.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3 lg:p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-xs lg:text-sm leading-tight line-clamp-2">
                    {service.name}
                  </h3>

                  {service.description && (
                    <p className="text-[10px] lg:text-xs text-gray-500 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 lg:gap-2 mt-auto pt-3">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-xs font-medium py-1.5 lg:py-2 rounded-lg transition-colors"
                    >
                      <Pencil size={11} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteClick(service.id, service.name)
                      }
                      className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs font-medium py-1.5 lg:py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={11} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {filtered.length} layanan · halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1.5 text-xs text-gray-400"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${
                          page === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
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
        <ServiceForm
          service={selected}
          onClose={handleClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-services"] });
            handleClose();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Service"
        message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: "" })}
        isLoading={isDeleting}
      />
    </div>
  );
}
