import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Leaf,
  Trash2,
  Edit2,
  Undo2,
  Plus,
  Check,
  X,
  Store,
  Copy
} from "lucide-react";
import { ShoppingList as ShoppingListType, Ingredient } from "../types";

interface ShoppingListProps {
  data: ShoppingListType;
  onListChange: (newList: ShoppingListType) => void;
}

interface CategoryColumnProps {
  categoryKey: keyof ShoppingListType;
  title: string;
  items: Ingredient[];
  icon: React.ElementType;
  colorClass: string;
  onUpdate: (
    category: keyof ShoppingListType,
    index: number,
    newQuantity: number
  ) => void;
  onDelete: (category: keyof ShoppingListType, index: number) => void;
  onAdd: (category: keyof ShoppingListType, item: Ingredient) => void;
}

const CategoryColumn: React.FC<CategoryColumnProps> = ({
  categoryKey,
  title,
  items,
  icon: Icon,
  colorClass,
  onUpdate,
  onDelete,
  onAdd,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("g");

  const handleSaveAdd = () => {
    if (!newName.trim()) return;
    onAdd(categoryKey, {
      name: newName.trim(),
      quantity: parseFloat(newQty) || 0,
      unit: newUnit.trim() || "g",
    });
    // Reset form
    setIsAdding(false);
    setNewName("");
    setNewQty("");
    setNewUnit("g");
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewName("");
    setNewQty("");
    setNewUnit("g");
  };

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div
        className={`p-4 flex items-center gap-3 border-b border-stone-200 ${colorClass}`}
      >
        <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-lg text-stone-800">{title}</h4>
      </div>
      
      <ul className="p-3 space-y-2 flex-grow">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="group flex items-center justify-between p-3 rounded-lg bg-white border border-stone-100 shadow-sm hover:border-emerald-200 transition-all"
          >
            <span className="text-stone-700 font-medium text-base flex-grow pr-2">
              {item.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  className="w-20 px-2 py-1.5 text-center text-sm font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  value={item.quantity === 0 ? "" : item.quantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseFloat(val);
                    onUpdate(
                      categoryKey,
                      idx,
                      isNaN(num) ? 0 : num
                    );
                  }}
                />
                <span className="text-xs text-stone-500 ml-1.5 font-mono select-none w-8 truncate">
                  {item.unit}
                </span>
              </div>
              <button
                onClick={() => onDelete(categoryKey, idx)}
                className="text-stone-300 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && !isAdding && (
          <li className="p-6 text-center text-stone-400 italic">
            No items in this list
          </li>
        )}
      </ul>

      {/* Add Item Section */}
      <div className="p-3 border-t border-stone-200 bg-stone-100/50">
        {isAdding ? (
          <div className="bg-white p-3 rounded-lg shadow-sm border border-stone-200 animate-in slide-in-from-bottom-2">
            <input
              autoFocus
              className="w-full text-sm p-2 mb-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-800 text-white placeholder-stone-400"
              placeholder="Item name (e.g. Garlic)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveAdd()}
            />
            <div className="flex gap-2">
              <input
                type="number"
                className="w-20 text-sm p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-800 text-white placeholder-stone-400"
                placeholder="Qty"
                value={newQty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNewQty(e.target.value)}
              />
              <input
                className="w-20 text-sm p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-800 text-white placeholder-stone-400"
                placeholder="Unit"
                value={newUnit}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setNewUnit(e.target.value)}
              />
              <button
                onClick={handleSaveAdd}
                disabled={!newName}
                className="ml-auto p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelAdd}
                className="p-2 bg-stone-200 text-stone-600 rounded hover:bg-stone-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-stone-300 hover:border-emerald-300"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>
    </div>
  );
};

const ShoppingList: React.FC<ShoppingListProps> = ({ data, onListChange }) => {
  const [listState, setListState] = useState<ShoppingListType>(data);
  const [lastDeleted, setLastDeleted] = useState<{
    category: keyof ShoppingListType;
    item: Ingredient;
    index: number;
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Sync state if props change (e.g. new recipe generated or parent update)
  useEffect(() => {
    setListState(data);
  }, [data]);

  const handleUpdateQuantity = (
    category: keyof ShoppingListType,
    index: number,
    newQuantity: number
  ) => {
    const newState = {
      ...listState,
      [category]: listState[category].map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      ),
    };
    setListState(newState);
    onListChange(newState);
  };

  const handleDeleteItem = (
    category: keyof ShoppingListType,
    index: number
  ) => {
    const itemToDelete = listState[category][index];
    setLastDeleted({ category, item: itemToDelete, index });
    const newState = {
      ...listState,
      [category]: listState[category].filter((_, i) => i !== index),
    };
    setListState(newState);
    onListChange(newState);
  };

  const handleUndo = () => {
    if (!lastDeleted) return;
    const { category, item, index } = lastDeleted;

    const newState = { ...listState };
    newState[category] = [...newState[category]];
    newState[category].splice(index, 0, item);

    setListState(newState);
    setLastDeleted(null);
    onListChange(newState);
  };

  const handleAddItem = (
    category: keyof ShoppingListType,
    item: Ingredient
  ) => {
    const newState = {
      ...listState,
      [category]: [...listState[category], item],
    };
    setListState(newState);
    onListChange(newState);
  };

  const handleCopyList = async () => {
    let text = "🛒 Shopping List (PortionPerfect)\n\n";

    if (listState.VegetableShop.length > 0) {
      text += "🥦 Vegetable Shop:\n";
      listState.VegetableShop.forEach((item) => {
        text += `• ${item.name}: ${item.quantity} ${item.unit}\n`;
      });
      text += "\n";
    }

    if (listState.GroceryShop.length > 0) {
      text += "🏪 Grocery Shop:\n";
      listState.GroceryShop.forEach((item) => {
        text += `• ${item.name}: ${item.quantity} ${item.unit}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-6 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 border-b border-stone-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Shopping List</h2>
            <p className="text-stone-500 text-sm">
              Review and customize your purchase needs.
            </p>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-3">
          <button
            onClick={handleCopyList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
            title="Copy List to Clipboard"
          >
            {copyFeedback ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy List</span>
              </>
            )}
          </button>
          
          <div className="flex gap-2 text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
            <Edit2 className="w-3 h-3" />
            <span className="hidden sm:inline">Tap quantities to edit</span>
            <span className="sm:hidden">Edit Qty</span>
          </div>
        </div>
      </div>

      {/* Undo Notification Banner */}
      {lastDeleted && (
        <div className="mb-6 bg-stone-800 text-white px-4 py-3 rounded-lg flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <span className="text-sm">
            Removed <span className="font-bold">{lastDeleted.item.name}</span>{" "}
            from {lastDeleted.category === "VegetableShop" ? "Vegetable Shop" : "Grocery Shop"}
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-xs font-bold transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryColumn
          categoryKey="VegetableShop"
          title="Vegetable Shop"
          items={listState.VegetableShop}
          icon={Leaf}
          colorClass="bg-green-50 border-green-200 text-green-800"
          onUpdate={handleUpdateQuantity}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
        <CategoryColumn
          categoryKey="GroceryShop"
          title="Grocery Shop"
          items={listState.GroceryShop}
          icon={Store}
          colorClass="bg-amber-50 border-amber-200 text-amber-800"
          onUpdate={handleUpdateQuantity}
          onDelete={handleDeleteItem}
          onAdd={handleAddItem}
        />
      </div>

      {/* Empty State Helper */}
      {(Object.values(listState) as Ingredient[][]).every((arr) => arr.length === 0) &&
        !lastDeleted && (
          <div className="text-center py-12 text-stone-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Your shopping list is empty.</p>
          </div>
        )}
    </div>
  );
};

export default ShoppingList;