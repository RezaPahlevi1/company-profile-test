import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImageOff, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts, deleteProduct } from "../../../api/products";
import ProductForm from "./ProductForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const ITEMS_PER_PAGE = 9;

export default function ProductList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | active | inactive
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(true),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Delete failed");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
  });

  const handleEdit = (product) => {
    setSelected(product);
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
    const allProducts = data?.data?.data || []; // ← di dalam
    let result = allProducts;
    if (filterStatus !== "all") {
      result = result.filter((p) =>
        filterStatus === "active" ? p.is_active : !p.is_active,
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [data, filterStatus, search]);

  // ✅ Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // Reset page saat filter/search berubah
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
      {/* Header — sticky di mobile */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Products
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Product</span>
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
              placeholder="Cari produk..."
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
              ? "Tidak ada produk yang sesuai filter."
              : "No products yet. Add your first product."}
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
          {/* ✅ 2 kolom di mobile, 3 di desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {paginated.map((product) => {
              const promoPrice =
                product.is_promo && product.discount_percent > 0
                  ? product.price -
                    (product.price * product.discount_percent) / 100
                  : null;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-32 sm:h-40 lg:h-48 bg-gray-100 flex items-center justify-center shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageOff size={24} className="text-gray-300" />
                    )}

                    {/* Badge promo */}
                    {product.is_promo && product.discount_percent > 0 && (
                      <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                        🔥 -{product.discount_percent}%
                      </div>
                    )}

                    {/* Status badge */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-3 lg:p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 text-xs lg:text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Harga */}
                    <div className="mt-1.5">
                      {promoPrice !== null ? (
                        <div>
                          <span className="text-red-600 font-bold text-xs lg:text-sm">
                            Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                          </span>
                          <span className="line-through text-gray-400 text-[10px] ml-1">
                            Rp {Number(product.price).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-blue-600 font-semibold text-xs lg:text-sm">
                          Rp {Number(product.price).toLocaleString("id-ID")}
                        </span>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {product.allow_negotiation ? "Negotiable" : "Fixed"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 lg:gap-2 mt-auto pt-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-xs font-medium py-1.5 lg:py-2 rounded-lg transition-colors"
                      >
                        <Pencil size={11} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClick(product.id, product.name)
                        }
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs font-medium py-1.5 lg:py-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={11} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ✅ Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-400">
                {filtered.length} produk · halaman {page} dari {totalPages}
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
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push("...");
                    }
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
        <ProductForm
          product={selected}
          onClose={handleClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
            handleClose();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: "" })}
        isLoading={isDeleting}
      />
    </div>
  );
}
