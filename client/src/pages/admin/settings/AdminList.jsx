import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosInstance";
import useAuthStore from "../../../store/authStore";
import ConfirmModal from "../../../components/ui/ConfirmModal";

const roleStyles = {
  superadmin: "bg-purple-100 text-purple-700",
  admin_konten: "bg-green-100 text-green-700",
  admin_order: "bg-blue-100 text-blue-700",
};

const roleLabels = {
  superadmin: "Superadmin",
  admin_konten: "Admin Konten",
  admin_order: "Admin Order",
};

const emptyForm = { name: "", email: "", password: "", role: "superadmin" };

async function fetchAdmins() {
  const res = await api.get("/admin/admins");
  return res.data.data;
}

export default function AdminList() {
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuthStore();

  const [modalMode, setModalMode] = useState(null); // "add" | "edit" | null
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    name: "",
  });

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: fetchAdmins,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/admin/admins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin berhasil ditambahkan");
      closeModal();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal menambahkan admin"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/admins/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin berhasil diperbarui");
      closeModal();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Gagal memperbarui admin"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Admin berhasil dihapus");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal menghapus admin");
      setConfirmModal({ isOpen: false, id: null, name: "" });
    },
  });

  const openAddModal = () => {
    setFormData(emptyForm);
    setSelectedAdmin(null);
    setModalMode("add");
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role,
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAdmin(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (modalMode === "add") {
      createMutation.mutate(formData);
    } else {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      updateMutation.mutate({ id: selectedAdmin.id, data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-100 pt-1 pb-3 lg:relative lg:bg-transparent lg:pt-0 lg:pb-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Manage Admins
          </h1>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Admin</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : !admins?.length ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">Belum ada admin terdaftar.</p>
        </div>
      ) : (
        <>
          {/* Table di desktop */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((admin) => {
                  const isSelf = currentAdmin?.id === admin.id;
                  const canDelete = !isSelf && admin.role !== "superadmin";
                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {admin.name}
                        </p>
                        {isSelf && (
                          <span className="text-[10px] text-blue-500">You</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{admin.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyles[admin.role]}`}
                        >
                          {roleLabels[admin.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(admin.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(admin)}
                            className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                id: admin.id,
                                name: admin.name,
                              })
                            }
                            disabled={!canDelete}
                            className={`p-1.5 rounded-lg transition-colors ${
                              canDelete
                                ? "hover:bg-red-50 hover:text-red-600 text-gray-400"
                                : "text-gray-200 cursor-not-allowed"
                            }`}
                            title={
                              isSelf
                                ? "Tidak bisa hapus akun sendiri"
                                : admin.role === "superadmin"
                                  ? "Superadmin tidak bisa dihapus"
                                  : "Delete"
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Card list di mobile */}
          <div className="lg:hidden space-y-2">
            {admins.map((admin) => {
              const isSelf = currentAdmin?.id === admin.id;
              const canDelete = !isSelf && admin.role !== "superadmin";
              return (
                <div
                  key={admin.id}
                  className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">
                        {admin.name}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] text-blue-500">You</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleStyles[admin.role]}`}
                      >
                        {roleLabels[admin.role]}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                      {admin.email}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(admin.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(admin)}
                      className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors border border-gray-100"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          id: admin.id,
                          name: admin.name,
                        })
                      }
                      disabled={!canDelete}
                      className={`p-2 rounded-lg transition-colors border border-gray-100 ${
                        canDelete
                          ? "hover:bg-red-50 hover:text-red-600 text-gray-400"
                          : "text-gray-200 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Add / Edit — layout sama dengan BlogForm */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:px-4 sm:py-6">
          <div className="bg-white w-full sm:rounded-xl shadow-xl sm:max-w-md h-full sm:h-auto sm:max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Tambah Admin" : "Edit Admin"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nama lengkap"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@contoh.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password{" "}
                    {modalMode === "add" ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      <span className="text-gray-400 font-normal text-xs">
                        (kosongkan jika tidak ingin mengubah)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    required={modalMode === "add"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      modalMode === "edit" ? "••••••••" : "Minimal 8 karakter"
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    disabled={
                      modalMode === "edit" &&
                      selectedAdmin?.id === currentAdmin?.id
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin_konten">Admin Konten</option>
                    <option value="admin_order">Admin Order</option>
                  </select>
                  {modalMode === "edit" &&
                    selectedAdmin?.id === currentAdmin?.id && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Tidak bisa mengubah role akun sendiri.
                      </p>
                    )}
                </div>

                <div className="h-2" />
              </form>
            </div>

            {/* Sticky footer */}
            <div className="flex gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hapus Admin"
        message={`Yakin ingin menghapus admin "${confirmModal.name}"? Tindakan ini tidak bisa dibatalkan.`}
        onConfirm={() => deleteMutation.mutate(confirmModal.id)}
        onCancel={() => setConfirmModal({ isOpen: false, id: null, name: "" })}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
