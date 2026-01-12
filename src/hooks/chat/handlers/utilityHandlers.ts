import { FunctionCall } from "@google/generative-ai";
import { getFormattedUserTime } from "@/lib/time";
import { FunctionHandlerArgs } from "./handlerUtils";

export const handleUtilityFunctions = async (
  functionCall: FunctionCall,
  args: FunctionHandlerArgs
): Promise<string> => {
  const { addThoughtStep } = args;
  let funcResultMsg = "";

  if (functionCall.name === "getCurrentTime") {
    addThoughtStep(
      "🔨 Getting current time context",
      "Retrieving time information for meal timing suggestions",
      "completed"
    );
    
    const currentTime = getFormattedUserTime();
    const now = new Date();
    const hour = now.getHours();
    
    let mealTimeContext = "";
    if (hour >= 5 && hour < 10) {
      mealTimeContext = "breakfast time";
    } else if (hour >= 10 && hour < 12) {
      mealTimeContext = "late morning/brunch time";
    } else if (hour >= 12 && hour < 15) {
      mealTimeContext = "lunch time";
    } else if (hour >= 15 && hour < 17) {
      mealTimeContext = "afternoon snack time";
    } else if (hour >= 17 && hour < 21) {
      mealTimeContext = "dinner time";
    } else if (hour >= 21 && hour < 24) {
      mealTimeContext = "evening/late night snack time";
    } else {
      mealTimeContext = "late night/early morning time";
    }
    
    funcResultMsg = `Current time: ${currentTime}. This is ${mealTimeContext}. Use this timing information to suggest appropriate meals for this time of day.`;
    addThoughtStep("✅ Executed: getCurrentTime");
  }

  return funcResultMsg;
};
