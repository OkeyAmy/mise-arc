/**
 * ASI Proxy - Replaces Supabase gemini-proxy with mise-asi endpoint
 * 
 * This module calls the mise-asi Flask server instead of Supabase functions.
 * The ASI handles orchestration, function calling, and response generation.
 */

import { Content } from "@google/generative-ai";

// Configure ASI endpoint - defaults to local development
const ASI_ENDPOINT = import.meta.env.VITE_ASI_ENDPOINT || "http://localhost:8001";

export interface ASIRequest {
    message: string;
    user_id: string;
    history?: Array<{ role: string; content: string }>;
}

export interface ASIResponse {
    text: string;
    function_calls: Array<{
        name: string;
        args: Record<string, unknown>;
        result: string;
    }>;
    thought_steps: string[];
    error?: string;
}

/**
 * Call the ASI orchestrator endpoint
 * 
 * Unlike the old Supabase proxy which returned raw Gemini API responses,
 * this returns a simplified response with the final text and metadata.
 */
export async function callASIProxy(
    message: string,
    userId: string,
    history?: Array<{ role: string; content: string }>
): Promise<ASIResponse> {
    try {
        console.log("🚀 Calling ASI proxy...");

        const response = await fetch(`${ASI_ENDPOINT}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
                user_id: userId,
                history: history || [],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `ASI proxy failed with status ${response.status}`);
        }

        const data: ASIResponse = await response.json();
        console.log("✅ ASI proxy response received");

        return data;
    } catch (error) {
        console.error("❌ ASI proxy error:", error);
        throw error;
    }
}

/**
 * Backwards-compatible wrapper for callGeminiProxy
 * 
 * This converts the old Content[] history format to the new ASI format
 * and wraps the response to match what useChat.ts expects.
 * 
 * @param history - Gemini Content[] format history
 * @param userId - User ID from session (optional, defaults to 'anonymous')
 */
export async function callGeminiProxy(history: Content[], userId?: string): Promise<any> {
    // Extract the last user message from history
    const lastUserMessage = [...history].reverse().find(c => c.role === "user");
    const messageText = lastUserMessage?.parts
        ?.map((p: any) => p.text || "")
        .filter(Boolean)
        .join(" ") || "";

    // Convert history to simpler format for ASI
    const convertedHistory = history.slice(0, -1).map(c => ({
        role: c.role === "model" ? "assistant" : c.role,
        content: c.parts?.map((p: any) => p.text || "").join(" ") || ""
    })).filter(h => h.content);

    try {
        const asiResponse = await callASIProxy(messageText, userId || "anonymous", convertedHistory);

        // Convert ASI response back to Gemini-like format for useChat compatibility
        // Since ASI handles all function calls server-side, we just return the text
        return {
            candidates: [{
                content: {
                    parts: [{ text: asiResponse.text }],
                    role: "model"
                }
            }],
            // Include thought steps for UI display
            thoughtSteps: asiResponse.thought_steps,
            functionCallsMade: asiResponse.function_calls
        };
    } catch (error) {
        console.error("ASI proxy error:", error);
        throw error;
    }
}

/**
 * Check if the ASI server is healthy
 */
export async function checkASIHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${ASI_ENDPOINT}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get list of available tools from ASI
 */
export async function getASITools(): Promise<string[]> {
    try {
        const response = await fetch(`${ASI_ENDPOINT}/tools`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.tools || [];
    } catch {
        return [];
    }
}
