import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createBrand, updateBrand } from "../../../api/brands";
import { brandSchema } from "../../../validations/brandSchema";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

const validateImageFile = (file) => {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Hanya JPEG, PNG, dan WebP yang diperbolehkan";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `Ukuran file maksimal ${MAX_SIZE_MB}MB`;
  }
  return null;
};

export default function BrandForm({ brand, onClose, onSuccess }) {
  const isEdit = Boolean(brand);
  const imageRef = useRef(null);
  const [imageError, setImageError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        is_active: brand.is_active,
      });
    }
  }, [brand, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) =>
      isEdit ? updateBrand(brand.id, formData) : createBrand(formData),
    onSuccess: () => {
      toast.success(isEdit ? "Brand updated" : "Brand created");
      onSuccess();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Something went wrong"),
  });

  const onSubmit = (data) => {
    const file = imageRef.current?.files[0];

    // Logo wajib ada saat create; saat edit boleh kosong (pakai logo lama)
    if (!isEdit && !file) {
      setImageError("Logo brand wajib diupload");
      return;
    }

    if (file) {
      const fileError = validateImageFile(file);
      if (fileError) {
        setImageError(fileError);
        return;
      }
    }
    setImageError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("is_active", String(data.is_active));
    if (file) {
      formData.append("image", file);
    }

    mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Brand" : "Add Brand"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter brand name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Hanya untuk identifikasi di admin & alt text gambar, tidak
              ditampilkan ke publik.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit && brand.image_url && (
              <div className="w-full h-28 bg-gray-50 rounded-lg mb-2 flex items-center justify-center p-3">
                <img
                  src={brand.image_url}
                  alt="Current"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={() => setImageError(null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imageError && (
              <p className="text-red-500 text-xs mt-1">{imageError}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {isEdit ? "Kosongkan untuk pakai logo lama. " : ""}Max 5MB. JPEG,
              PNG, WebP. Sebaiknya logo dengan latar transparan.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("is_active")}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {isPending ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
