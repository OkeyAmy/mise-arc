
import { UseChatProps } from "../types";

export type AddThoughtStep = (
  step: string,
  details?: string,
  status?: "pending" | "active" | "completed"
) => void;

export type FunctionHandlerArgs = Omit<UseChatProps, 'apiKey' | 'onApiKeyMissing' | 'setThoughtSteps'> & {
  addThoughtStep: AddThoughtStep;
};

// Helper function to remove sensitive fields from data before showing to user
export const sanitizeDataForDisplay = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForDisplay(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized = { ...data };
    // Remove sensitive fields
    delete sanitized.id;
    delete sanitized.user_id;
    delete sanitized.created_at;
    delete sanitized.updated_at;
    return sanitized;
  }
  
  return data;
};
