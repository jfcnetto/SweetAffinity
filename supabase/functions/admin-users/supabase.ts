import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Adicionando logs para depuração
console.log("Supabase: VITE_SUPABASE_URL:", supabaseUrl ? "Definida" : "NÃO DEFINIDA");
console.log("Supabase: VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Definida" : "NÃO DEFINIDA");
console.log("Supabase: URL (primeiros 20 chars):", supabaseUrl ? supabaseUrl.substring(0, 20) : "N/A");
console.log("Supabase: Anon Key (primeiros 20 chars):", supabaseAnonKey ? supabaseAnonKey.substring(0, 20) : "N/A");


if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não está definida nas variáveis de ambiente. Por favor, verifique seu arquivo .env.local na raiz do projeto.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não está definida nas variáveis de ambiente. Por favor, verifique seu arquivo .env.local na raiz do projeto.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);