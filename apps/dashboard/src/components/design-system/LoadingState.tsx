import React from 'react';

interface LoadingStateProps {
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex space-x-4 items-center">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-800/60 rounded w-5/6 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
