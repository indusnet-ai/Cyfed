import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  return (
    <div className="relative group inline-block cursor-help ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 transition-colors" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] p-2 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-center leading-relaxed">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-width border-t-slate-800 border-l-transparent border-r-transparent border-b-transparent border-[4px]"></div>
      </div>
    </div>
  );
};
