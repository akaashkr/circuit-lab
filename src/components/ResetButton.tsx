import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
  title?: string;
}

export const ResetButton: React.FC<ResetButtonProps> = ({ onReset, title = 'Reset to Default' }) => {
  return (
    <button
      onClick={onReset}
      title={title}
      aria-label={title}
      className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-full shadow-lg hover:shadow-orange-500/40 active:scale-95 transition-all transform flex items-center justify-center border-2 border-white/60 focus:outline-none"
    >
      <RotateCcw className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
};
