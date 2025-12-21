import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comment, songTitle, artistName } = await req.json();
    
    if (!comment || typeof comment !== 'string') {
      return new Response(
        JSON.stringify({ approved: false, reason: "Invalid comment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      // Fail open but log - allow comment through if moderation unavailable
      return new Response(
        JSON.stringify({ approved: true, reason: "Moderation unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a content moderator for $ongChainn, a music streaming platform. Your job is to review comments on songs and determine if they should be approved or rejected.

REJECT comments that contain:
- Spam or promotional content
- Hate speech, racism, sexism, or discrimination
- Personal attacks on the artist or other users
- Harassment or bullying
- Explicit sexual content
- Threats of violence
- Misinformation or defamation
- Excessive profanity used aggressively
- Links to external sites (unless clearly relevant to discussion)

APPROVE comments that:
- Share genuine opinions about the music (even if critical, as long as respectful)
- Ask questions about the song or artist
- Express appreciation or constructive feedback
- Discuss the music, lyrics, or production
- Share how the music made them feel

Context: This comment is on the song "${songTitle}" by ${artistName}.

Respond with ONLY a JSON object in this exact format:
{"approved": true/false, "reason": "brief explanation"}`
          },
          {
            role: "user",
            content: `Review this comment: "${comment}"`
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ approved: true, reason: "Rate limited, allowing through" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ approved: true, reason: "Credits exhausted, allowing through" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ approved: true, reason: "Moderation error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    try {
      // Parse the JSON response from the AI
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return new Response(
          JSON.stringify({ 
            approved: result.approved === true, 
            reason: result.reason || "Moderation complete" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
    }

    // Default to approved if parsing fails
    return new Response(
      JSON.stringify({ approved: true, reason: "Moderation complete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ approved: true, reason: "Error during moderation" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
