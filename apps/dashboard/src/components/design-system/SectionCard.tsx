import React from 'react';

interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-[#0f172a] border border-slate-800 rounded-xl p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h4 className="text-lg font-bold text-white tracking-tight">{title}</h4>}
          {description && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
