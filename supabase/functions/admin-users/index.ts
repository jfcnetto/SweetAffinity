// supabase/functions/admin-users/index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts"
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*", // em produção troque pelo seu domínio
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

serve(async (req) => {
  // Preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 })
  }

  try {
    let data

    if (req.method === "POST") {
      const body = await req.json()
      const name = body.name || "Guest"
      data = { message: `Hello ${name}!` }
    } else if (req.method === "GET") {
      // Usa a service role key para listar todos os usuários (admin)
      const { data: users, error } = await supabase.auth.admin.listUsers()
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        })
      }
      data = users
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
