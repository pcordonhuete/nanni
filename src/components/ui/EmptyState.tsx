import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-violet-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="bg-violet-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-violet-700 transition"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="bg-violet-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-violet-700 transition"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
