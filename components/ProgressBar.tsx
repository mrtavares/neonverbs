import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color = "bg-neon-blue", label }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="w-full">
      {label && <div className="text-xs text-gray-400 mb-1 font-display uppercase tracking-widest">{label}</div>}
      <div className="h-3 w-full bg-neon-dark border border-gray-700 rounded-full overflow-hidden relative">
        <div 
          className={`h-full ${color} transition-all duration-300 ease-out shadow-[0_0_10px_currentColor]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
