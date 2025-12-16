
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string; // e.g. "2 tbsp", "1 large", "1/2 cup"
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ShoppingList {
  VegetableShop: Ingredient[];
  GroceryShop: Ingredient[];
}

export interface RecipeResponse {
  recipeTitle: string;
  cookTime: string;
  nutrition: Nutrition;
  ingredients: RecipeIngredient[];
  steps: string[];
  substitutions: string[];
  shoppingList: ShoppingList;
}

export interface RecipeFormData {
  dishName: string;
  peopleCount: number;
  restrictions: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  role: 'customer' | 'owner';
  // Owner specific fields
  shopName?: string;
  shopType?: string;
  location?: string; // Human readable name
  coordinates?: string; // "lat,long" for calculation
}

export interface Shop {
  name: string;
  type: string;
  location: string; // Human readable
  coordinates: string; // "lat,long"
  ownerName: string;
  phone: string;
  distance?: string; // Calculated distance
}

export interface OrderItem extends Ingredient {
  available?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  shopPhone: string; // Used to route order to the correct shop owner
  shopId: string;    // Explicit ID
  shopName: string;  // Explicit Name
  items: OrderItem[];
  listType: 'Vegetable' | 'Grocery' | 'Mixed';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: number;
}
