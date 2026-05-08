import React from 'react';

interface CascadeItem {
  label: string;
  count: number;
  description: string;
}

interface CascadePreviewProps {
  items: CascadeItem[];
}

export function CascadePreview({ items }: CascadePreviewProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-800 mb-3">
        The following will be affected:
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
              {item.count}
            </span>
            <div>
              <span className="text-sm font-medium text-amber-900">{item.label}</span>
              <p className="text-xs text-amber-700">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
