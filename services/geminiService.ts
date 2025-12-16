import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecipeResponse, RecipeFormData } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for Shopping List (Strict Metric)
const metricIngredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the ingredient" },
    quantity: { type: Type.NUMBER, description: "Precise metric weight" },
    unit: { type: Type.STRING, description: "Unit (g or kg)" },
  },
  required: ["name", "quantity", "unit"],
};

// Schema for Recipe Card (Culinary Units)
const culinaryIngredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the ingredient" },
    amount: { type: Type.STRING, description: "Culinary amount (e.g. '2 tbsp', '1 large', '1/2 cup')" },
  },
  required: ["name", "amount"],
};

// Main response schema
const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recipeTitle: { type: Type.STRING },
    cookTime: { type: Type.STRING },
    nutrition: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
      },
      required: ["calories", "protein", "carbs", "fat"],
    },
    ingredients: {
      type: Type.ARRAY,
      items: culinaryIngredientSchema,
      description: "Ingredients list using standard cooking units (tbsp, cups, etc)",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    substitutions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of swaps made for allergies, if any",
    },
    shoppingList: {
      type: Type.OBJECT,
      properties: {
        VegetableShop: { type: Type.ARRAY, items: metricIngredientSchema, description: "Items bought at a Vegetable Market (Fresh vegetables, fruits, herbs like Coriander/Mint, Ginger, Garlic, Green Chillies, Lemon)." },
        GroceryShop: { type: Type.ARRAY, items: metricIngredientSchema, description: "Items bought at a General Grocery Store/Kirana Store (Spices, Dal/Lentils, Rice, Flour/Atta/Besan, Dairy/Curd/Paneer/Milk, Oil, Salt, Sugar, Packaged Meat, Dry Fruits)." },
      },
      required: ["VegetableShop", "GroceryShop"],
    },
  },
  required: [
    "recipeTitle",
    "cookTime",
    "nutrition",
    "ingredients",
    "steps",
    "substitutions",
    "shoppingList",
  ],
};

const SYSTEM_INSTRUCTION = `
You are PortionPerfect, a recipe generation assistant. Produce clear, precise recipes scaled to the requested number of people.

**Ingredient Naming & Localization (CRITICAL):**
1. **Simplicity:** Use simple, generic names for ingredients.
2. **Indian Common Terminology:** Use the name most commonly used in Indian households to avoid confusion.
   * **"Hing"** instead of "Asafoetida".
   * **"Ghee"** instead of "Clarified Butter".
   * **"Ajwain"** instead of "Carom Seeds".
   * **"Methi"** instead of "Fenugreek".
   * **"Coriander"** instead of "Cilantro".
   * **"Capsicum"** instead of "Bell Pepper".
   * **"Brinjal"** instead of "Eggplant" or "Aubergine".
   * **"Lady Finger"** instead of "Okra".
   * **"Corn Flour"** instead of "Cornstarch".
   * **"Curd"** or **"Yogurt"**.
   * **"Semolina"** or **"Rava"**.
   * **"Besan"** instead of "Chickpea Flour".
**The cook time is the time required to cook+ time to prepare**
**Format Guidelines:**
1. **Recipe Ingredients List:** Use standard, user-friendly culinary units that are easy to cook with (e.g., "2 tbsp", "1.5 cups", "1 large", "3 cloves").
2. **Shopping List:** You MUST convert all ingredient amounts into **precise metric weights (grams or kilograms)**. This is for purchasing efficiency.
3. **Shopping List Categorization:**
   * **VegetableShop:** Include ONLY fresh produce (Vegetables, Fruits, Fresh Herbs, Ginger, Garlic, Chillies, Lemon).
   * **GroceryShop:** Include everything else (Spices, Grains, Flours, Dairy, Oils, Packaged Goods, Meat/Fish).

**Shopping List Rounding Rules:**
* if the item is too small like <100 grams then display it as 100g only because we cant buy 1g 2g in shop
* ≥1000 g: nearest 0.05 kg (50 g).


**General:**
* Use sensible culinary weight conversions (e.g., 1 large egg = 50 g).
* Handle allergies/preferences strictly.
`;

export const generateRecipe = async (
  formData: RecipeFormData
): Promise<RecipeResponse> => {
  const prompt = `Create a recipe for: ${formData.dishName}. Scale exactly for ${
    formData.peopleCount
  } people. Dietary restrictions: ${
    formData.restrictions || "None"
  }.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.3, 
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No text returned from Gemini.");
    }

    const data = JSON.parse(jsonText) as RecipeResponse;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};