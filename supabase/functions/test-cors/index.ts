// C:\SweetAffinity.com\supabase\functions\test-cors\index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts"

serve((req) => {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  })

  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 })
  }

  return new Response(
    JSON.stringify({ message: "CORS funcionando 🎉" }),
    { headers, status: 200 }
  )
})

