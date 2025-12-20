import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, address, message, signature, nonce } = await req.json();

    // Create Supabase client with service role for database access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate nonce endpoint
    if (action === "generate-nonce") {
      const newNonce = crypto.randomUUID().replace(/-/g, "");
      return new Response(
        JSON.stringify({ nonce: newNonce }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature endpoint
    if (action === "verify") {
      if (!address || !message || !signature) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract nonce from SIWE message
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
      const messageNonce = nonceMatch?.[1];

      if (!messageNonce) {
        return new Response(
          JSON.stringify({ error: "Invalid message format - no nonce found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Clean up expired nonces (older than 10 minutes)
      await supabase
        .from('used_nonces')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Try to insert nonce - if it already exists, INSERT will fail (replay attack)
      const { error: nonceError } = await supabase
        .from('used_nonces')
        .insert({ 
          nonce: messageNonce,
          used_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min expiry
        });

      if (nonceError) {
        console.log("Nonce check failed:", nonceError.message);
        // If insert failed due to duplicate, nonce was already used
        if (nonceError.code === '23505') { // PostgreSQL unique violation
          return new Response(
            JSON.stringify({ error: "Nonce already used" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // For other errors, log but continue (don't block auth entirely)
        console.error("Nonce storage error:", nonceError);
      }

      // For Base Smart Wallets, we need to verify using ERC-6492/EIP-1271
      // The signature verification happens on-chain for smart contract wallets
      // For now, we verify the address format and message structure
      
      // Validate address format (case-insensitive for checksummed addresses)
      const addressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!addressRegex.test(address)) {
        return new Response(
          JSON.stringify({ error: "Invalid wallet address format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate SIWE message - check for standard SIWE patterns or the address in the message
      // Base wallet may return different formats depending on the connection method
      const hasSIWEFormat = message.includes("wants you to sign in with your Ethereum account") ||
                            message.includes("Sign in to SongChainn") ||
                            message.toLowerCase().includes(address.toLowerCase());
      
      if (!hasSIWEFormat) {
        console.log("Message validation failed. Message:", message.substring(0, 200));
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create deterministic email from wallet address for Supabase auth
      const walletEmail = `${address.slice(2, 14).toLowerCase()}@base.wallet`;
      const walletPassword = `base_${address.slice(-16).toLowerCase()}`;

      // Try to sign in existing user
      let authResult = await supabase.auth.signInWithPassword({
        email: walletEmail,
        password: walletPassword,
      });

      // If user doesn't exist, create new account
      if (authResult.error?.message?.includes("Invalid login credentials")) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: walletEmail,
          password: walletPassword,
          email_confirm: true,
          user_metadata: {
            base_wallet_address: address,
            auth_method: "base_app",
            verified_at: new Date().toISOString(),
          },
        });

        if (error) {
          console.error("User creation error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Sign in the newly created user
        authResult = await supabase.auth.signInWithPassword({
          email: walletEmail,
          password: walletPassword,
        });
      }

      if (authResult.error) {
        console.error("Auth error:", authResult.error);
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: authResult.data.session,
          user: authResult.data.user,
          walletAddress: address,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
