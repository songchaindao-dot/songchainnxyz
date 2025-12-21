import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comment, songTitle, artistName } = await req.json();
    
    console.log('Moderating comment:', { comment, songTitle, artistName });

    if (!comment || typeof comment !== 'string') {
      console.log('Invalid comment provided');
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Invalid comment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Quick client-side checks first
    const trimmedComment = comment.trim();
    
    // Check for empty or too short comments
    if (trimmedComment.length < 2) {
      console.log('Comment too short');
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Comment is too short' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for excessive caps (spam indicator)
    const capsRatio = (trimmedComment.match(/[A-Z]/g) || []).length / trimmedComment.length;
    if (trimmedComment.length > 10 && capsRatio > 0.7) {
      console.log('Excessive caps detected');
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Please avoid excessive capitalization' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for repeated characters (spam indicator)
    if (/(.)\1{5,}/.test(trimmedComment)) {
      console.log('Repeated characters detected');
      return new Response(
        JSON.stringify({ allowed: false, reason: 'Please avoid repeating characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI for content moderation
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      // If no API key, do basic keyword filtering
      return basicModeration(trimmedComment, corsHeaders);
    }

    const moderationPrompt = `You are a content moderator for a music platform. Analyze the following comment and determine if it should be allowed.

The comment is for the song "${songTitle || 'Unknown'}" by "${artistName || 'Unknown'}".

Comment to analyze: "${trimmedComment}"

A comment should be BLOCKED if it contains:
- Hate speech, slurs, or discrimination
- Threats or wishes of harm to the artist, song, or other users
- Explicit sexual content
- Spam, advertisements, or promotional links
- Excessive profanity or vulgar language
- Personal attacks or harassment
- Misinformation or defamatory statements about the artist

A comment should be ALLOWED if it:
- Expresses genuine opinion (positive or negative) about the music
- Provides constructive criticism
- Shares personal connection to the song
- Engages respectfully with other listeners
- Uses mild language that's common in music discussions

Respond with ONLY a JSON object in this exact format:
{"allowed": true/false, "reason": "brief explanation if blocked"}

If allowed, use: {"allowed": true, "reason": ""}`;

    console.log('Calling Lovable AI for moderation...');

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'user', content: moderationPrompt }
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('Lovable AI request failed:', response.status);
      return basicModeration(trimmedComment, corsHeaders);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);

    // Parse the AI response
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('Moderation result:', result);
        
        return new Response(
          JSON.stringify({
            allowed: result.allowed === true,
            reason: result.reason || ''
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback to basic moderation if AI response parsing fails
    return basicModeration(trimmedComment, corsHeaders);

  } catch (error) {
    console.error('Error in moderate-comment:', error);
    return new Response(
      JSON.stringify({ allowed: true, reason: '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});

// Basic keyword-based moderation as fallback
function basicModeration(comment: string, corsHeaders: Record<string, string>) {
  const lowerComment = comment.toLowerCase();
  
  // List of harmful keywords (keeping it family-friendly in the code)
  const blockedPatterns = [
    /\b(kill|murder|die|death threat)\b/i,
    /\b(hate|despise)\s+(this\s+)?(artist|singer|person)\b/i,
    /\b(trash|garbage|worst)\s+(artist|music|song)\s+ever\b/i,
    /\b(should\s+)?(quit|stop|never)\s+(making\s+)?(music|singing)\b/i,
    /\bkys\b/i,
    /\b(unalive|unaliv)\b/i,
    /https?:\/\/\S+/i, // Block links
    /\b(buy|sale|discount|promo|free money)\b/i, // Spam patterns
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(lowerComment)) {
      console.log('Basic moderation blocked comment');
      return new Response(
        JSON.stringify({ 
          allowed: false, 
          reason: 'This comment may violate our community guidelines. Please be respectful.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  console.log('Basic moderation allowed comment');
  return new Response(
    JSON.stringify({ allowed: true, reason: '' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}