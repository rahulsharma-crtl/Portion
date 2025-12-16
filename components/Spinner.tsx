import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 text-emerald-600 animate-in fade-in zoom-in duration-300">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <h3 className="text-xl font-semibold text-stone-800">Calculating optimal package sizes...</h3>
      <p className="text-stone-500 mt-2">Converting cups to grams and scaling portions.</p>
    </div>
  );
};

export default Spinner;
