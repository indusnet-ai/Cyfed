import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-xl text-center">
      <AlertCircle className="w-8 h-8 text-slate-500 mb-3" />
      <h6 className="text-sm font-bold text-white tracking-tight">{title}</h6>
      <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xs">{description}</p>
    </div>
  );
};
