import React from 'react';

interface ProgressBarProps {
  progress: number;
  status: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, status }) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-slate-400">
        <span>{status}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};