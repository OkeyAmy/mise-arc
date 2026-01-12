
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const updateUserNotesTool: FunctionDeclaration = {
  name: "updateUserNotes",
  description: "Updates the user's general notes with new information. Use this to remember miscellaneous facts or context provided by the user.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      notes: {
        type: SchemaType.STRING,
        description: "The new content to be saved in the user's notes. This will overwrite existing notes.",
      },
    },
    required: ["notes"],
  },
};
