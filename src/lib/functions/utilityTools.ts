
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const getCurrentTimeTool: FunctionDeclaration = {
  name: "getCurrentTime",
  description: "Gets the current date, day of the week, and time for the user.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};
