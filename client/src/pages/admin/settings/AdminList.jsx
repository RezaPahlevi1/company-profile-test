import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import api from "../../../api/axiosInstance";
import useAuthStore from "../../../store/authStore";

const AdminList = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "superadmin",
  });
  const queryClient = useQueryClient();
  const { admin: currentAdmin } = useAuthStore();

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const res = await api.get("/admin/admins");
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post("/admin/admins", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admins"]);
      toast.success("Admin created successfully");
      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "superadmin" });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create admin"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await api.put(`/admin/admins/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admins"]);
      toast.success("Admin updated successfully");
      setIsEditModalOpen(false);
      setSelectedAdmin(null);
      setFormData({ name: "", email: "", password: "", role: "superadmin" });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update admin"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/admin/admins/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admins"]);
      toast.success("Admin deleted successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete admin"),
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: selectedAdmin.id, data: formData });
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (admin) => {
    if (
      window.confirm(`Are you sure you want to delete admin ${admin.name}?`)
    ) {
      deleteMutation.mutate(admin.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Admins</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins?.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {admin.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{admin.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          admin.role === "superadmin"
                            ? "bg-purple-100 text-purple-800"
                            : admin.role === "admin_konten"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-gray-400 hover:text-blue-600 transition"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          className={`text-gray-400 hover:text-red-600 transition ${currentAdmin?.id === admin.id || admin.role === "superadmin" ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={
                            currentAdmin?.id === admin.id ||
                            admin.role === "superadmin"
                          }
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals for Add / Edit */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {isAddModalOpen ? "Add New Admin" : "Edit Admin"}
              </h2>
              <form
                onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password{" "}
                    {isEditModalOpen && "(Leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    required={isAddModalOpen}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    disabled={
                      isEditModalOpen && selectedAdmin?.id === currentAdmin?.id
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin_konten">Admin Konten</option>
                    <option value="admin_order">Admin Order</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;
