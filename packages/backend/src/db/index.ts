import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema.js";

// =====================================================
// VALIDAÇÃO DE ENV
// =====================================================

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não encontrada. Verifique o arquivo .env");
}

// =====================================================
// POOL POSTGRES
// =====================================================

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,

  max: Number(process.env.DATABASE_MAX_CONNECTIONS ?? 20),

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000,
});

// =====================================================
// DRIZZLE ORM
// =====================================================

export const db = drizzle(pool, {
  schema,
});

// =====================================================
// TESTE DE CONEXÃO
// =====================================================

export async function testDatabase() {
  let client;

  try {
    client = await pool.connect();

    await client.query("SELECT 1");

    console.log("✅ PostgreSQL conectado com sucesso.");

    return true;
  } catch (err) {
    console.error("❌ Erro ao conectar ao PostgreSQL:");
    console.error(err);

    throw err;
  } finally {
    if (client) client.release();
  }
}

// =====================================================
// SHUTDOWN LIMPO
// =====================================================

export async function closeDatabase() {
  try {
    await pool.end();
    console.log("🛑 Pool PostgreSQL finalizado.");
  } catch (err) {
    console.error("❌ Erro ao fechar conexão com PostgreSQL:");
    console.error(err);
  }
}