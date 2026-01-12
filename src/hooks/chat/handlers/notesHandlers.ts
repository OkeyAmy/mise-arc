
import { FunctionCall } from "@google/generative-ai";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleNotesFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep, onUpdateUserPreferences } = args;
  let funcResultMsg = "";

  if (functionCall.name === "updateUserNotes") {
    try {
      const { notes } = functionCall.args as { notes: string };
      if (onUpdateUserPreferences) {
        await onUpdateUserPreferences({ notes });
        funcResultMsg = "I've updated your notes with this information.";
      } else {
        funcResultMsg = "Notes function is not available right now.";
      }
    } catch (e) {
      console.error(e);
      funcResultMsg = "I had trouble updating your notes.";
    }
    addThoughtStep("✅ Executed: updateUserNotes");
  }

  return funcResultMsg;
};
