import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import { getServices, deleteService } from "../../../api/services";
import ServiceForm from "./ServiceForm";
import ConfirmModal from "../../../components/ui/ConfirmModal";

export default function ServiceList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

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

  const handleDeleteClick = (id, name) => {
    setConfirmModal({ isOpen: true, id, name });
  };

  const handleConfirmDelete = () => {
    remove(confirmModal.id);
  };

  const services = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Service
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <p className="text-gray-400">
            No services yet. Add your first service.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageOff size={32} className="text-gray-300" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {service.name}
                  </h3>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      service.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {service.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-blue-300 hover:text-blue-600 text-gray-600 text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(service.id, service.name)}
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
