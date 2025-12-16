import React, { useState } from "react";
import { ChefHat, Users, AlertCircle } from "lucide-react";
import { RecipeFormData } from "../types";

interface InputFormProps {
  onSubmit: (data: RecipeFormData) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [dishName, setDishName] = useState("");
  const [peopleCount, setPeopleCount] = useState(2);
  const [restrictions, setRestrictions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;
    onSubmit({ dishName, peopleCount, restrictions });
  };

  return (
    <section className="w-full max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
        <div className="bg-emerald-600 p-6 sm:p-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <ChefHat className="w-10 h-10" />
            PortionPerfect
          </h1>
          <p className="text-emerald-50 text-lg">
            Precision metric recipes scaled exactly to your needs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Dish Name */}
            <div className="md:col-span-6">
              <label
                htmlFor="dishName"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                What are you cooking?
              </label>
              <input
                id="dishName"
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="e.g. Spicy Thai Green Curry"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 text-white bg-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>

            {/* People Count */}
            <div className="md:col-span-3">
              <label
                htmlFor="peopleCount"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                How many people?
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="peopleCount"
                  type="number"
                  min="1"
                  max="100"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-white bg-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Restrictions */}
            <div className="md:col-span-3">
              <label
                htmlFor="restrictions"
                className="block text-sm font-semibold text-stone-700 mb-2"
              >
                Dietary Needs <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="restrictions"
                  type="text"
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder="e.g. Nut allergy"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-white bg-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 px-6 rounded-xl text-lg font-bold text-white shadow-md transition-all transform hover:scale-[1.01] active:scale-[0.99]
              ${
                isLoading
                  ? "bg-stone-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
          >
            {isLoading ? "Generating Recipe..." : "Create Precision Recipe"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default InputForm;