import { PackageOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No data found",
  description = "",
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
