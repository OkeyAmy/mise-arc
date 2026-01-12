/**
 * @deprecated This module is deprecated in favor of asiProxy.ts
 * The mise-asi Python service now handles orchestration instead of Supabase functions.
 * 
 * To use the new ASI system:
 * 1. Start the ASI server: cd mise-asi && python main.py
 * 2. Import from asiProxy.ts instead: import { callASIProxy } from './asiProxy'
 * 
 * This file now re-exports from asiProxy for backwards compatibility.
 */

import { Content } from "@google/generative-ai";

// Re-export the backwards-compatible wrapper with userId support
export { callGeminiProxy } from './asiProxy';

/*
============================================================================
OLD SUPABASE IMPLEMENTATION - COMMENTED OUT
Kept for reference during migration. The code below used Supabase edge 
functions for orchestration. Now replaced by mise-asi Flask server.
============================================================================

import { supabase } from "@/integrations/supabase/client";
import { tools } from '@/lib/gemini/tools';
import { getSystemPrompt } from '@/lib/prompts/systemPrompt';

export async function callGeminiProxy_OLD(history: Content[]) {
    // Transform tools for Gemini API (snake_case for REST API)
    const toolsForProxy = (tools as any[])?.map(tool => {
        if (tool.functionDeclarations) {
            return { function_declarations: tool.functionDeclarations };
        }
        return tool;
    });

    const payload = { 
        contents: history,
        tools: toolsForProxy,
        systemInstruction: {
            parts: [{ text: getSystemPrompt() }]
        }
    };

    try {
        console.log("Attempting Gemini proxy call...");
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: payload,
        });

        if (error) {
            throw new Error(`Gemini proxy failed: ${error.message}`);
        }

        return data;
    } catch (geminiError) {
        console.log("Gemini proxy failed, attempting Groq fallback:", geminiError);
        
        try {
            const { data, error } = await supabase.functions.invoke('groq-proxy', {
                body: payload,
            });

            if (error) {
                throw new Error(`Groq fallback failed: ${error.message}`);
            }

            console.log("Groq fallback successful");
            return data;
        } catch (groqError) {
            console.error("Both Gemini and Groq proxies failed:", groqError);
            throw new Error(`Both Gemini and Groq proxies failed: ${groqError.message}`);
        }
    }
}
*/
