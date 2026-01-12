
import { MealPlan } from "./schema";

export const initialMealPlan: MealPlan = {
  plan_id: "xyz-123",
  days: [
    {
      date: "2025-05-20",
      day: "Monday",
      meals: {
        breakfast: { name: "Spinach Omelette", calories: 300, macros: { protein: 25, carbs: 5, fat: 20 }, ingredients: [{ item: "Eggs", quantity: 2, unit: "pc" }, { item: "Spinach", quantity: 50, unit: "g" }] },
        lunch: { name: "Grilled Chicken Salad", calories: 450, macros: { protein: 40, carbs: 10, fat: 28 }, ingredients: [{ item: "Chicken Breast", quantity: 150, unit: "g" }, { item: "Mixed Greens", quantity: 100, unit: "g" }] },
        dinner: { name: "Salmon with Quinoa", calories: 550, macros: { protein: 35, carbs: 40, fat: 25 }, ingredients: [{ item: "Salmon Fillet", quantity: 150, unit: "g" }, { item: "Quinoa", quantity: 80, unit: "g" }] },
        snacks: { name: "Apple with Almond Butter", calories: 250, macros: { protein: 5, carbs: 25, fat: 15 }, ingredients: [{ item: "Apple", quantity: 1, unit: "pc" }, { item: "Almond Butter", quantity: 2, unit: "tbsp" }] },
      },
    },
    {
      date: "2025-05-21",
      day: "Tuesday",
      meals: {
        breakfast: { name: "Oatmeal with Berries", calories: 350, macros: { protein: 10, carbs: 60, fat: 8 }, ingredients: [{ item: "Oats", quantity: 50, unit: "g" }, { item: "Mixed Berries", quantity: 70, unit: "g" }] },
        lunch: { name: "Lentil Soup", calories: 400, macros: { protein: 20, carbs: 55, fat: 10 }, ingredients: [{ item: "Lentils", quantity: 100, unit: "g" }, { item: "Vegetable Broth", quantity: 500, unit: "ml" }] },
        dinner: { name: "Tofu Stir-fry", calories: 500, macros: { protein: 25, carbs: 45, fat: 22 }, ingredients: [{ item: "Tofu", quantity: 200, unit: "g" }, { item: "Broccoli", quantity: 100, unit: "g" }] },
        snacks: { name: "Greek Yogurt", calories: 150, macros: { protein: 15, carbs: 10, fat: 5 }, ingredients: [{ item: "Greek Yogurt", quantity: 150, unit: "g" }] },
      },
    },
    // Adding more days for a full week
    {
      date: "2025-05-22",
      day: "Wednesday",
      meals: {
        breakfast: { name: "Avocado Toast", calories: 320, macros: { protein: 8, carbs: 30, fat: 20 }, ingredients: [{ item: "Whole Wheat Bread", quantity: 2, unit: "slices" }, { item: "Avocado", quantity: 1, unit: "pc" }] },
        lunch: { name: "Turkey Wrap", calories: 420, macros: { protein: 30, carbs: 35, fat: 18 }, ingredients: [{ item: "Turkey Breast", quantity: 100, unit: "g" }, { item: "Whole Wheat Tortilla", quantity: 1, unit: "pc" }] },
        dinner: { name: "Beef and Broccoli", calories: 580, macros: { protein: 45, carbs: 25, fat: 35 }, ingredients: [{ item: "Beef Sirloin", quantity: 150, unit: "g" }, { item: "Broccoli", quantity: 150, unit: "g" }] },
        snacks: { name: "Handful of Almonds", calories: 200, macros: { protein: 7, carbs: 6, fat: 18 }, ingredients: [{ item: "Almonds", quantity: 30, unit: "g" }] },
      },
    },
    {
      date: "2025-05-23",
      day: "Thursday",
      meals: {
        breakfast: { name: "Scrambled Eggs", calories: 280, macros: { protein: 20, carbs: 2, fat: 22 }, ingredients: [{ item: "Eggs", quantity: 3, unit: "pc" }] },
        lunch: { name: "Quinoa Salad", calories: 400, macros: { protein: 15, carbs: 50, fat: 18 }, ingredients: [{ item: "Quinoa", quantity: 100, unit: "g" }, { item: "Cucumber", quantity: 50, unit: "g" }, { item: "Tomato", quantity: 50, unit: "g" }] },
        dinner: { name: "Baked Cod", calories: 450, macros: { protein: 40, carbs: 5, fat: 30 }, ingredients: [{ item: "Cod Fillet", quantity: 200, unit: "g" }, { item: "Lemon", quantity: 1, unit: "pc" }] },
        snacks: { name: "Protein Shake", calories: 250, macros: { protein: 30, carbs: 15, fat: 7 }, ingredients: [{ item: "Protein Powder", quantity: 1, unit: "scoop" }] },
      },
    },
    {
      date: "2025-05-24",
      day: "Friday",
       meals: {
        breakfast: { name: "Pancakes", calories: 400, macros: { protein: 10, carbs: 65, fat: 12 }, ingredients: [{ item: "Flour", quantity: 100, unit: "g" }, { item: "Milk", quantity: 150, unit: "ml" }] },
        lunch: { name: "Chicken Caesar Salad", calories: 480, macros: { protein: 35, carbs: 15, fat: 32 }, ingredients: [{ item: "Chicken Breast", quantity: 150, unit: "g" }, { item: "Romaine Lettuce", quantity: 100, unit: "g" }] },
        dinner: { name: "Spaghetti Bolognese", calories: 600, macros: { protein: 30, carbs: 70, fat: 22 }, ingredients: [{ item: "Ground Beef", quantity: 150, unit: "g" }, { item: "Spaghetti", quantity: 100, unit: "g" }] },
        snacks: { name: "Rice Cakes with Peanut Butter", calories: 220, macros: { protein: 8, carbs: 25, fat: 10 }, ingredients: [{ item: "Rice Cakes", quantity: 2, unit: "pc" }, { item: "Peanut Butter", quantity: 2, unit: "tbsp" }] },
      },
    },
    {
      date: "2025-05-25",
      day: "Saturday",
      meals: {
        breakfast: { name: "Fruit Smoothie", calories: 300, macros: { protein: 5, carbs: 50, fat: 8 }, ingredients: [{ item: "Banana", quantity: 1, unit: "pc" }, { item: "Mixed Berries", quantity: 100, unit: "g" }] },
        lunch: { name: "Tuna Sandwich", calories: 450, macros: { protein: 25, carbs: 40, fat: 20 }, ingredients: [{ item: "Canned Tuna", quantity: 1, unit: "can" }, { item: "Whole Wheat Bread", quantity: 2, unit: "slices" }] },
        dinner: { name: "Pizza", calories: 700, macros: { protein: 30, carbs: 80, fat: 30 }, ingredients: [{ item: "Pizza Dough", quantity: 1, unit: "pc" }, { item: "Tomato Sauce", quantity: 100, unit: "g" }, { item: "Mozzarella", quantity: 100, unit: "g" }] },
        snacks: { name: "Dark Chocolate", calories: 150, macros: { protein: 2, carbs: 15, fat: 10 }, ingredients: [{ item: "Dark Chocolate", quantity: 30, unit: "g" }] },
      },
    },
    {
      date: "2025-05-26",
      day: "Sunday",
       meals: {
        breakfast: { name: "Waffles", calories: 450, macros: { protein: 12, carbs: 70, fat: 15 }, ingredients: [{ item: "Waffle Mix", quantity: 100, unit: "g" }, { item: "Maple Syrup", quantity: 50, unit: "ml" }] },
        lunch: { name: "Leftover Pizza", calories: 700, macros: { protein: 30, carbs: 80, fat: 30 }, ingredients: [] },
        dinner: { name: "Roast Chicken", calories: 650, macros: { protein: 50, carbs: 30, fat: 35 }, ingredients: [{ item: "Whole Chicken", quantity: 1, unit: "kg" }, { item: "Potatoes", quantity: 200, unit: "g" }] },
        snacks: { name: "Popcorn", calories: 180, macros: { protein: 5, carbs: 25, fat: 7 }, ingredients: [{ item: "Popcorn Kernels", quantity: 50, unit: "g" }] },
      },
    },
  ],
};
