import React from 'react';
import { ChefHat, Store } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: 'customer' | 'owner') => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-emerald-900 mb-4 tracking-tight">
          Portion<span className="text-emerald-600">Perfect</span>
        </h1>
        <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed">
          Your precision culinary partner. Are you here to cook delicious meals or manage your store inventory?
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
        <button
          onClick={() => onSelect('customer')}
          className="group relative flex flex-col items-center p-8 bg-white border border-stone-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all duration-300 text-center"
        >
          <div className="p-5 bg-emerald-100 rounded-full text-emerald-600 mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <ChefHat className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-stone-800 mb-3">I'm a Customer</h3>
          <p className="text-stone-500 text-base leading-relaxed">
            I want to generate precision recipes, scale ingredients, and create shopping lists.
          </p>
          <div className="mt-6 px-4 py-2 bg-stone-50 text-emerald-700 text-sm font-semibold rounded-full group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            Start Cooking &rarr;
          </div>
        </button>

        <button
          onClick={() => onSelect('owner')}
          className="group relative flex flex-col items-center p-8 bg-white border border-stone-200 rounded-3xl shadow-sm hover:shadow-xl hover:border-blue-500 hover:-translate-y-1 transition-all duration-300 text-center"
        >
          <div className="p-5 bg-blue-100 rounded-full text-blue-600 mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <Store className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-bold text-stone-800 mb-3">I'm a Shop Owner</h3>
          <p className="text-stone-500 text-base leading-relaxed">
            I want to register my shop details and manage the inventory of items I sell.
          </p>
          <div className="mt-6 px-4 py-2 bg-stone-50 text-blue-700 text-sm font-semibold rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
            Manage Shop &rarr;
          </div>
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;