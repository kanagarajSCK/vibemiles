import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Loader2 className="w-10 h-10 animate-spin text-teal-700" />
      <p className="text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
};
