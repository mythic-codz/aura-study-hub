import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { batch_id, content_type, content_index, title, pdf_url } = await req.json();

    if (!batch_id || !content_type || content_index === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Require a known device (enrolled user) to prevent anonymous AI-credit drain
    const deviceId = req.headers.get("x-device-id");
    if (!deviceId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: knownUser } = await supabase
      .from("users").select("id").eq("device_id", deviceId).maybeSingle();
    if (!knownUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if quiz already exists
    const { data: existing } = await supabase
      .from("quizzes")
      .select("*")
      .eq("batch_id", batch_id)
      .eq("content_type", content_type)
      .eq("content_index", content_index)
      .maybeSingle();

    if (existing && existing.questions && (existing.questions as any[]).length > 0) {
      return new Response(JSON.stringify(existing), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to fetch PDF content for context
    let contentContext = "";
    if (pdf_url) {
      try {
        const pdfResp = await fetch(pdf_url);
        if (pdfResp.ok) {
          // We can't parse PDF binary in edge function easily, so use title + URL info
          contentContext = `This is a PDF lecture titled "${title || 'Unknown'}". The PDF URL is: ${pdf_url}`;
        }
      } catch { /* ignore */ }
    }

    if (!contentContext && title) {
      contentContext = `This is a lecture titled "${title}".`;
    }

    if (!contentContext) {
      contentContext = "This is a study lecture.";
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a quiz generator for an educational platform. Generate exactly 5 multiple-choice questions based on the lecture content provided. Each question should test understanding of key concepts from the lecture. Make questions educational and fair - not trick questions. Questions should be based on typical content that would be covered in a lecture with the given title/topic.`,
          },
          {
            role: "user",
            content: `Generate 5 quiz questions for the following lecture:\n\n${contentContext}\n\nCreate questions that would reasonably test a student's understanding of this topic.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_quiz",
              description: "Create a quiz with 5 multiple-choice questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "The question text" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Exactly 4 answer options",
                        },
                        correct_answer: { type: "integer", description: "Index (0-3) of the correct option" },
                        explanation: { type: "string", description: "Brief explanation of why the answer is correct" },
                      },
                      required: ["question", "options", "correct_answer", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_quiz" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "Failed to generate quiz" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let questions: any[] = [];

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        questions = parsed.questions || [];
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(JSON.stringify({ error: "Failed to parse quiz" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store quiz
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .upsert({
        batch_id,
        content_type,
        content_index,
        questions,
      }, { onConflict: "batch_id,content_type,content_index" })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "Failed to save quiz" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(quiz), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
