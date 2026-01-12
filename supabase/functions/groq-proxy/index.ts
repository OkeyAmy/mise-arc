
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Convert Gemini format to OpenAI format for Groq
    const messages = body.contents?.map((content: any) => ({
      role: content.role === "model" ? "assistant" : content.role,
      content: content.parts?.map((part: any) => part.text || "").join("") || ""
    })) || [];

    // Add system instruction if provided
    if (body.systemInstruction?.parts?.[0]?.text) {
      messages.unshift({
        role: "system",
        content: body.systemInstruction.parts[0].text
      });
    }

    // Convert tools from Gemini format to OpenAI format
    const tools = body.tools?.[0]?.function_declarations?.map((func: any) => ({
      type: "function",
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    })) || [];

    const groqPayload = {
      model: "deepseek-r1-distill-llama-70b",
      messages: messages.slice(-10), // Keep last 10 messages to avoid token limits
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false,
      tools: tools.length > 0 ? tools : undefined,
    };

    console.log("Payload to Groq:", JSON.stringify(groqPayload, null, 2));

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groqPayload),
    });

    const groqData = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq API error:", groqData);
      return new Response(JSON.stringify(groqData), {
        status: groqRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert OpenAI response back to Gemini format
    const choice = groqData.choices?.[0];
    if (!choice) {
      throw new Error("No response from Groq");
    }

    const geminiResponse = {
      candidates: [{
        content: {
          parts: []
        }
      }]
    };

    // Handle function calls
    if (choice.message?.tool_calls) {
      for (const toolCall of choice.message.tool_calls) {
        geminiResponse.candidates[0].content.parts.push({
          functionCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments || "{}")
          }
        });
      }
    }

    // Handle text response
    if (choice.message?.content) {
      geminiResponse.candidates[0].content.parts.push({
        text: choice.message.content
      });
    }

    return new Response(JSON.stringify(geminiResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Groq proxy error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
