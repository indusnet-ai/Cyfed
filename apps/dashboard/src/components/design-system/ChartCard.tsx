import React from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col h-[320px] ${className}`}>
      <div className="mb-4">
        <h5 className="text-sm font-bold text-white tracking-tight">{title}</h5>
        {description && <p className="text-slate-400 text-[10px] mt-0.5">{description}</p>}
      </div>
      <div className="flex-1 w-full min-h-0 relative">
        {children}
      </div>
    </div>
  );
};
