import React, { useState } from "react";
import InputForm from "./components/InputForm";
import RecipeCard from "./components/RecipeCard";
import ShoppingList from "./components/ShoppingList";
import Spinner from "./components/Spinner";
import LoginForm from "./components/LoginForm";
import RoleSelection from "./components/RoleSelection";
import ShopOwnerDashboard from "./components/ShopOwnerDashboard";
import NearbyShops from "./components/NearbyShops";
import { generateRecipe } from "./services/geminiService";
import { getNearbyShops } from "./services/shopService";
import { RecipeFormData, RecipeResponse, ShoppingList as ShoppingListType, UserProfile, Shop } from "./types";
import { AlertTriangle, BookOpen, ShoppingBag, LogOut, User, Store } from "lucide-react";

const CUSTOMER_KEY = 'portionPerfect_customer';
const OWNER_KEY = 'portionPerfect_owner';
const LAST_VIEW_KEY = 'portionPerfect_last_view';

type ViewState = 'ROLE_SELECTION' | 'LOGIN' | 'CUSTOMER_DASHBOARD' | 'OWNER_DASHBOARD';

const App: React.FC = () => {
  // Initialize state from localStorage based on the last active view
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const lastView = localStorage.getItem(LAST_VIEW_KEY);
      if (lastView === 'owner') {
        const saved = localStorage.getItem(OWNER_KEY);
        return saved ? JSON.parse(saved) : null;
      } else if (lastView === 'customer') {
        const saved = localStorage.getItem(CUSTOMER_KEY);
        return saved ? JSON.parse(saved) : null;
      }
    }
    return null;
  });

  // Determine initial view based on persisted profile and last view
  const [view, setView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined') {
      const lastView = localStorage.getItem(LAST_VIEW_KEY);
      if (lastView === 'owner' && localStorage.getItem(OWNER_KEY)) {
        return 'OWNER_DASHBOARD';
      }
      if (lastView === 'customer' && localStorage.getItem(CUSTOMER_KEY)) {
        return 'CUSTOMER_DASHBOARD';
      }
    }
    return 'ROLE_SELECTION';
  });

  const [loginRole, setLoginRole] = useState<'customer'|'owner'>('customer');

  // Customer App State
  const [recipeData, setRecipeData] = useState<RecipeResponse | null>(null);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recipe" | "shopping">("recipe");

  const handleRoleSelect = (role: 'customer' | 'owner') => {
    const storageKey = role === 'owner' ? OWNER_KEY : CUSTOMER_KEY;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      // Restore session for this role
      const profile = JSON.parse(saved);
      setUserProfile(profile);
      localStorage.setItem(LAST_VIEW_KEY, role);
      setView(role === 'owner' ? 'OWNER_DASHBOARD' : 'CUSTOMER_DASHBOARD');
    } else {
      // No session found for this role, go to login
      setLoginRole(role);
      setView('LOGIN');
    }
  };

  const handleLoginSubmit = (profile: UserProfile) => {
    const storageKey = profile.role === 'owner' ? OWNER_KEY : CUSTOMER_KEY;
    localStorage.setItem(storageKey, JSON.stringify(profile));
    localStorage.setItem(LAST_VIEW_KEY, profile.role);
    
    setUserProfile(profile);
    if (profile.role === 'owner') {
      setView('OWNER_DASHBOARD');
    } else {
      setView('CUSTOMER_DASHBOARD');
    }
  };

  const handleGoHome = () => {
    // Keeps user logged in (in storage) but shows role selection
    // We clear the userProfile state so we don't accidentally render a dashboard behind logic,
    // though the view state controls that.
    setView('ROLE_SELECTION');
  };

  const handleLogout = () => {
    if (!userProfile) return;
    
    // Only clear the session for the current role
    const storageKey = userProfile.role === 'owner' ? OWNER_KEY : CUSTOMER_KEY;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(LAST_VIEW_KEY);
    
    setUserProfile(null);
    setRecipeData(null);
    setNearbyShops([]);
    setView('ROLE_SELECTION');
  };

  const handleFormSubmit = async (formData: RecipeFormData) => {
    setLoading(true);
    setError(null);
    setRecipeData(null);
    setNearbyShops([]);
    setActiveTab("recipe");
    try {
      // 1. Generate Recipe
      const data = await generateRecipe(formData);
      setRecipeData(data);

      // 2. Fetch Nearby Shops using user's coordinates
      let shops: Shop[] = [];
      if (userProfile?.coordinates) {
        shops = await getNearbyShops(userProfile.coordinates);
      } else if (userProfile?.location && /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(userProfile.location)) {
        shops = await getNearbyShops(userProfile.location);
      } else {
        shops = await getNearbyShops(""); 
      }
      setNearbyShops(shops);

    } catch (err) {
      setError("Failed to generate recipe. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShoppingListChange = (newList: ShoppingListType) => {
    if (recipeData) {
      setRecipeData({ ...recipeData, shoppingList: newList });
    }
  };

  const hasApiKey = !!process.env.API_KEY;

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl max-w-md text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">API Key Missing</h2>
          <p>Please set the <code className="bg-red-100 px-1 rounded">API_KEY</code> environment variable to use PortionPerfect.</p>
        </div>
      </div>
    );
  }

  // --- VIEW RENDERING ---

  if (view === 'ROLE_SELECTION') {
    return (
      <div className="min-h-screen bg-stone-50">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <RoleSelection onSelect={handleRoleSelect} />
        </main>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-stone-50">
        <main className="max-w-6xl mx-auto px-4 py-8">
          <LoginForm 
            role={loginRole} 
            onSubmit={handleLoginSubmit} 
            onBack={() => setView('ROLE_SELECTION')}
            initialData={userProfile || undefined}
          />
        </main>
      </div>
    );
  }

  if (view === 'OWNER_DASHBOARD' && userProfile) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="font-bold text-xl tracking-tight text-blue-800 flex items-center gap-2">
              <Store className="w-6 h-6 text-blue-600" />
              <span>Portion<span className="text-blue-600">Perfect</span> <span className="text-stone-400 text-sm font-normal">Business</span></span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 pt-8">
          <ShopOwnerDashboard profile={userProfile} onGoHome={handleGoHome} />
        </main>
      </div>
    );
  }

  if (view === 'CUSTOMER_DASHBOARD' && userProfile) {
    return (
      <div className="min-h-screen bg-stone-50 pb-20">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div 
              className="font-bold text-xl tracking-tight text-emerald-800 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleGoHome}
            >
              Portion<span className="text-emerald-600">Perfect</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 pt-8">
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-6 text-emerald-800 bg-emerald-50 w-fit px-4 py-2 rounded-full border border-emerald-100 mx-auto">
              <User className="w-4 h-4"/>
              <span className="font-medium">Welcome, {userProfile.name}</span>
            </div>

            <InputForm onSubmit={handleFormSubmit} isLoading={loading} />

            {error && (
              <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {loading && <Spinner />}

            {recipeData && !loading && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <div>
                  <div className="flex justify-center mb-8 border-b border-stone-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab("recipe")}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                          activeTab === "recipe"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        <BookOpen className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "recipe" ? "text-emerald-500" : "text-stone-400 group-hover:text-stone-500"}`} />
                        Recipe Details
                      </button>

                      <button
                        onClick={() => setActiveTab("shopping")}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                          activeTab === "shopping"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        <ShoppingBag className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === "shopping" ? "text-emerald-500" : "text-stone-400 group-hover:text-stone-500"}`} />
                        Shopping List
                      </button>
                    </nav>
                  </div>

                  <div className="min-h-[400px]">
                    {activeTab === "recipe" ? (
                      <div className="animate-in fade-in duration-300">
                        <RecipeCard data={recipeData} />
                      </div>
                    ) : (
                      <div className="animate-in fade-in duration-300">
                        <ShoppingList data={recipeData.shoppingList} onListChange={handleShoppingListChange} />
                      </div>
                    )}
                  </div>
                  
                  {/* Nearby Shops Section */}
                  <div className="mt-12 border-t border-stone-200 pt-8">
                    <NearbyShops 
                      shops={nearbyShops} 
                      shoppingList={recipeData.shoppingList}
                      userProfile={userProfile}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Fallback (should not be reached)
  return null;
};

export default App;