
import { GoogleGenerativeAI, Part, Content, GenerateContentResponse, FunctionCall } from "@google/generative-ai";
import { getSystemPrompt } from "../prompts/systemPrompt";
import { tools } from "./tools";

// This function is for non-streaming, single-response calls (e.g., after a function call)
export async function callGemini(apiKey: string, contents: Content[]): Promise<GenerateContentResponse> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API key is required to connect to Gemini");
  }

  try {
    console.log("Calling Gemini with model: gemini-2.5-pro");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: getSystemPrompt(),
      tools,
    });
    
    const { response } = await model.generateContent({ contents });
    return response;
  } catch (error) {
    console.error("Detailed Gemini API error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key not valid') || 
          error.message.includes('API_KEY_INVALID') ||
          error.message.includes('invalid API key')) {
        throw new Error("The provided API key is not valid. Please check and try again.");
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        throw new Error("API quota exceeded or billing issue. Please check your Gemini API account.");
      }
      if (error.message.includes('model') || error.message.includes('not found')) {
        throw new Error("The requested Gemini model is not available. Please try again later.");
      }
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    
    throw new Error("An unexpected error occurred while connecting to Gemini AI. Please try again.");
  }
}

// New streaming function with thinking
export interface StreamHandlers {
  onThought: (thought: string) => void;
  onFunctionCall: (call: FunctionCall) => void;
  onText: (text: string) => void;
  onComplete: () => Promise<void>;
  onError: (error: Error) => void;
}

export async function callGeminiWithStreaming(
  apiKey: string,
  contents: Content[],
  handlers: StreamHandlers
) {
  if (!apiKey || apiKey.trim() === '') {
    handlers.onError(new Error("API key is required to connect to Gemini"));
    return;
  }

  try {
    console.log("Calling Gemini streaming with model: gemini-2.5-pro");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: getSystemPrompt(),
      tools,
    });
    
    const streamingResult = await model.generateContentStream({
      contents,
    });

    let functionCallEncountered = false;

    for await (const chunk of streamingResult.stream) {
      if (chunk.candidates && chunk.candidates.length > 0) {
        const parts = chunk.candidates[0].content.parts;
        for (const part of parts) {
          if ((part as any).thought && part.text) {
            handlers.onThought(part.text);
          } else if (part.functionCall) {
            functionCallEncountered = true;
            handlers.onFunctionCall(part.functionCall);
          } else if (part.text && !functionCallEncountered) {
            handlers.onText(part.text);
          }
        }
      }
    }

    await handlers.onComplete();

  } catch (error) {
    console.error("Gemini streaming API error:", error);
    handlers.onError(error instanceof Error ? error : new Error("Gemini streaming API error"));
  }
}
