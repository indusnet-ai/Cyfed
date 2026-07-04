import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 mb-6">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">{title}</h2>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
      </div>
      {action && <div className="mt-4 md:mt-0 flex items-center gap-3">{action}</div>}
    </div>
  );
};
