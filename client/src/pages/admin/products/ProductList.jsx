import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts, deleteProduct } from "../../../api/products";
import ProductForm from "./ProductForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

export default function ProductList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

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

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = () => {
    remove(confirmModal.id);
  };

  const products = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-400">
            No products yet. Add your first product.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff size={32} className="text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {product.name}
                  </h3>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      product.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="text-blue-600 font-semibold text-sm mt-2">
                  Rp {Number(product.price).toLocaleString("id-ID")}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {product.allow_negotiation ? "Negotiable" : "Fixed price"}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product.id, product.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
