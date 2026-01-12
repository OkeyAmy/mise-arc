
import { suggestMealTool } from '../functions/mealSuggestionTools';
import { updateInventoryTool, getInventoryTool } from "../functions/inventoryTools";
import { getUserPreferencesTool, updateUserPreferencesTool } from '../functions/preferenceTools';
import { getLeftoversTool, addLeftoverTool, updateLeftoverTool, removeLeftoverTool, showLeftoversTool, adjustLeftoverServingsTool } from "../functions/leftoverTools";
import { showShoppingListTool, getShoppingListTool, addToShoppingListTool, removeFromShoppingListTool } from '../functions/shoppingListTools';
import { getCurrentTimeTool } from '../functions/utilityTools';
import { updateUserNotesTool } from '../functions/notesTools';

// Import CRUD tools
import { 
  getInventoryItemsTool, 
  createInventoryItemsTool, 
  replaceInventoryItemTool, 
  updateInventoryItemTool, 
  deleteInventoryItemTool 
} from '../functions/crudInventoryTools';

import { 
  getShoppingListItemsTool, 
  createShoppingListItemsTool, 
  replaceShoppingListTool, 
  updateShoppingListItemTool, 
  deleteShoppingListItemsTool 
} from '../functions/crudShoppingListTools';

import { 
  getUserPreferencesDataTool, 
  createUserPreferencesTool, 
  replaceUserPreferencesTool, 
  updateUserPreferencesPartialTool, 
  deleteUserPreferenceFieldsTool 
} from '../functions/crudPreferencesTools';

import { 
  getLeftoverItemsTool, 
  createLeftoverItemsTool, 
  replaceLeftoverItemTool, 
  updateLeftoverItemPartialTool, 
  deleteLeftoverItemTool 
} from '../functions/crudLeftoversTools';

// Import Amazon search tools
import {
  searchAmazonProductTool,
  searchMultipleAmazonProductsTool,
  getAmazonSearchResultsTool,
  clearAmazonSearchCacheTool
} from '../functions/amazonSearchTools';

export const tools = [{ functionDeclarations: [
    // Original tools
    suggestMealTool,
    showShoppingListTool, 
    updateInventoryTool, 
    getInventoryTool, 
    getShoppingListTool, 
    addToShoppingListTool, 
    removeFromShoppingListTool, 
    getCurrentTimeTool,
    getUserPreferencesTool,
    updateUserPreferencesTool,
    getLeftoversTool,
    addLeftoverTool,
    updateLeftoverTool,
    adjustLeftoverServingsTool,
    removeLeftoverTool,
    showLeftoversTool,
    updateUserNotesTool,
    
    // CRUD tools for Inventory
    getInventoryItemsTool,
    createInventoryItemsTool,
    replaceInventoryItemTool,
    updateInventoryItemTool,
    deleteInventoryItemTool,
    
    // CRUD tools for Shopping List
    getShoppingListItemsTool,
    createShoppingListItemsTool,
    replaceShoppingListTool,
    updateShoppingListItemTool,
    deleteShoppingListItemsTool,
    
    // CRUD tools for Preferences
    getUserPreferencesDataTool,
    createUserPreferencesTool,
    replaceUserPreferencesTool,
    updateUserPreferencesPartialTool,
    deleteUserPreferenceFieldsTool,
    
    // CRUD tools for Leftovers
    getLeftoverItemsTool,
    createLeftoverItemsTool,
    replaceLeftoverItemTool,
    updateLeftoverItemPartialTool,
    deleteLeftoverItemTool,
    
    // Amazon search tools
    searchAmazonProductTool,
    searchMultipleAmazonProductsTool,
    getAmazonSearchResultsTool,
    clearAmazonSearchCacheTool,
] }];
