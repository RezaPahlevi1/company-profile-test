const variants = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-brand-100 text-brand-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const statusMap = {
  published: "success",
  draft: "warning",
  paid: "success",
  pending: "warning",
  failed: "danger",
  cancelled: "default",
  active: "success",
  inactive: "default",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  return (
    <span
      className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full 
      text-xs font-medium ${variants[variant]} ${className}
    `}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const variant = statusMap[status] || "default";
  return <Badge variant={variant}>{status}</Badge>;
}
