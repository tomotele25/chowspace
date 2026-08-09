/**
 * Fallback product categories.
 *
 * The backend is authoritative — pages fetch GET /api/product-categories and
 * use this list only if that request fails, so a network blip can't leave a
 * vendor staring at an empty category dropdown.
 *
 * Keep in step with constants/productCategories.js in the chowspace_backend
 * repo, which is the seed source for the ProductCategory collection.
 */
export const PRODUCT_CATEGORIES = [
  "African",
  "Fast Food",
  "Pastry",
  "Rice Dishes",
  "Swallows",
  "Soups & Stews",
  "Snacks",
  "Grilled/Fried",
  "Beverages",
  "Smoothies",
  "Small Chops",
  "Shawarma & Sandwiches",
  "Bakery",
  "Drinks",
  "Desserts",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Combos & Platters",
  "Family Packs",
  "Continental",
];

export default PRODUCT_CATEGORIES;
