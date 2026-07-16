import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createService, updateService } from "../../../api/services";
import { serviceSchema } from "../../../validations/serviceSchema";

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

export default function ServiceForm({ service, onClose, onSuccess }) {
  const isEdit = Boolean(service);
  const imageRef = useRef(null);
  const [imageError, setImageError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
      is_promo: false,
      is_orderable: false,
      price: "",
      discount_percent: "0",
    },
  });

  const watchIsPromo = watch("is_promo");
  const watchIsOrderable = watch("is_orderable");
  const watchPrice = watch("price");
  const watchDiscount = watch("discount_percent");

  const promoPrice =
    watchIsPromo && watchPrice && watchDiscount
      ? parseFloat(watchPrice) -
        (parseFloat(watchPrice) * parseFloat(watchDiscount)) / 100
      : null;

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        description: service.description || "",
        is_active: service.is_active,
        is_promo: service.is_promo || false,
        is_orderable: service.is_orderable || false,
        price: service.price != null ? String(service.price) : "",
        discount_percent: String(service.discount_percent || 0),
      });
    }
  }, [service, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (formData) =>
      isEdit ? updateService(service.id, formData) : createService(formData),
    onSuccess: () => {
      toast.success(isEdit ? "Service updated" : "Service created");
      onSuccess();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Something went wrong"),
  });

  const onSubmit = (data) => {
    const file = imageRef.current?.files[0];
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
    formData.append("description", data.description || "");
    formData.append("is_active", String(data.is_active));
    formData.append("is_promo", String(data.is_promo));
    formData.append("is_orderable", String(data.is_orderable));
    formData.append("price", data.price || "");
    formData.append(
      "discount_percent",
      data.is_promo ? data.discount_percent || "0" : "0",
    );

    if (file) {
      formData.append("image", file);
    }

    mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Service" : "Add Service"}
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
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter service name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe this service, pricing reference, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga (Rp){" "}
              {watchIsOrderable && <span className="text-red-500">*</span>}
            </label>
            <input
              {...register("price")}
              inputMode="numeric"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500000"
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">
                {errors.price.message}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Kosongkan jika layanan ini hanya dipesan via WhatsApp (tidak
              ditampilkan harga di website).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Image
            </label>
            {isEdit && service.image_url && (
              <img
                src={service.image_url}
                alt="Current"
                className="w-full h-36 object-cover rounded-lg mb-2"
              />
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
              {isEdit ? "Leave empty to keep current image. " : ""}Max 5MB.
              JPEG, PNG, WebP.
            </p>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("is_active")}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          {/* Pemesanan Online */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("is_orderable")}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-sm font-medium text-gray-700">
                🛒 Bisa Dipesan Online
              </span>
            </label>
            <p className="text-xs text-gray-500">
              Jika diaktifkan, pelanggan bisa langsung checkout & membayar
              layanan ini lewat website (bukan hanya WhatsApp). Wajib isi harga
              di atas. Pemesanan layanan selalu 1 booking per order.
            </p>
          </div>

          {/* Promo */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register("is_promo")}
                className="w-4 h-4 rounded accent-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🔥 Tandai sebagai Promo
              </span>
            </label>

            {watchIsPromo && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="100"
                    {...register("discount_percent")}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Contoh: 20"
                  />
                </div>

                {promoPrice !== null && !isNaN(promoPrice) && watchPrice && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Preview harga:</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="line-through text-gray-400 text-sm">
                        Rp {parseFloat(watchPrice).toLocaleString("id-ID")}
                      </span>
                      <span className="text-red-600 font-bold">
                        Rp {Math.round(promoPrice).toLocaleString("id-ID")}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        -{watchDiscount}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
