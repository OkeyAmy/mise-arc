
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const acknowledgeSharedItemsTool: FunctionDeclaration = {
  name: "acknowledgeSharedItems",
  description: "Acknowledges when shared shopping list items have been imported and provides suggestions for what to do with them.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      items: {
        type: SchemaType.ARRAY,
        description: "The imported shopping list items.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            item: { type: SchemaType.STRING, description: "The name of the item." },
            quantity: { type: SchemaType.NUMBER, description: "The quantity of the item." },
            unit: { type: SchemaType.STRING, description: "The unit of measurement." },
          },
          required: ["item", "quantity", "unit"]
        }
      },
      message: {
        type: SchemaType.STRING,
        description: "A helpful message about what the user can do with these imported items (meal planning, recipes, etc.)."
      }
    },
    required: ["items", "message"],
  },
};
