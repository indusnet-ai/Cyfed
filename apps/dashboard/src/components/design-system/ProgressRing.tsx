import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  textColor?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 72,
  strokeWidth = 6,
  color = 'stroke-indigo-500',
  textColor = 'text-white',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={`transition-all duration-500 ease-out ${color}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Percentage Text */}
      <span className={`absolute text-xs font-extrabold ${textColor}`}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};
