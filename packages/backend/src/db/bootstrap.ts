import { pool } from "./index.js";

export async function bootstrapDatabase() {
  console.log("🛠️ Iniciando bootstrap/sincronização do schema do banco de dados...");
  const client = await pool.connect();
  try {
    // 1. Criar Enums se não existirem
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE partnership_type AS ENUM ('companionship', 'financial', 'mentorship', 'travel', 'other');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE meeting_frequency AS ENUM ('flexible', 'weekly', 'bi_weekly', 'monthly', 'multi_weekly');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Criar tabelas plans e profile_moderation_queue
    await client.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "price_cents" integer NOT NULL,
        "billing_period" text NOT NULL,
        "features" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "stripe_price_id" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_highlighted" boolean NOT NULL DEFAULT false,
        "discount_percentage" integer NOT NULL DEFAULT 0,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "profile_moderation_queue" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "profile_id" uuid NOT NULL,
        "status" moderation_status NOT NULL DEFAULT 'pending',
        "reviewed_by" uuid,
        "reviewed_at" timestamp with time zone,
        "rejection_reason" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // Criar enum blog_post_source e tabela blog_posts
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE blog_post_source AS ENUM ('ai_auto', 'ai_manual', 'manual');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "content" text NOT NULL,
        "meta_description" text NOT NULL,
        "source" blog_post_source NOT NULL DEFAULT 'manual',
        "author_id" uuid,
        "published_at" timestamp with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);


    // 3. Adicionar novas colunas à tabela profiles se não existirem
    const addColumn = async (colName: string, colType: string, colDefault?: string) => {
      try {
        const query = `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "${colName}" ${colType} ${colDefault ? `DEFAULT ${colDefault}` : ''};`;
        await client.query(query);
      } catch (err) {
        console.warn(`[Bootstrap] Aviso ao adicionar coluna ${colName}:`, err);
      }
    };

    await addColumn("last_active_at", "timestamp with time zone");
    await addColumn("moderation_status", "moderation_status", "'pending'::moderation_status");
    await addColumn("availability", "text");
    await addColumn("partnership_type", "partnership_type");
    await addColumn("meeting_frequency", "meeting_frequency");
    
    // Novas colunas solicitadas
    await addColumn("country", "text", "'Brasil'");
    await addColumn("body_type", "text");
    await addColumn("skin_tone", "text");
    await addColumn("children", "text");
    await addColumn("net_worth", "text");
    await addColumn("seeking_gender", "text");
    await addColumn("travel_preference", "text");

    // Adicionar colunas para a tabela plans
    const addPlanColumn = async (colName: string, colType: string, colDefault?: string) => {
      try {
        const query = `ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "${colName}" ${colType} ${colDefault ? `DEFAULT ${colDefault}` : ''};`;
        await client.query(query);
      } catch (err) {
        console.warn(`[Bootstrap] Aviso ao adicionar coluna ${colName} em plans:`, err);
      }
    };

    await addPlanColumn("is_highlighted", "boolean", "false");
    await addPlanColumn("discount_percentage", "integer", "0");

    // Garantir que todos os perfis existentes possuam status 'approved' (para retrocompatibilidade)
    await client.query(`
      UPDATE "profiles" SET "moderation_status" = 'approved' WHERE "moderation_status" IS NULL;
    `);

    // Diagnósticos - Verificar salvamento de fotos
    try {
      const photosRes = await client.query(`SELECT COUNT(*) FROM "photos"`);
      console.log(`📸 [Diagnóstico DB] Total de fotos registradas no banco:`, photosRes.rows[0].count);
      
      const samplePhotos = await client.query(`SELECT "id", "user_id", "storage_path", "is_primary" FROM "photos" LIMIT 5`);
      if (samplePhotos.rows.length > 0) {
        console.log(`📸 [Diagnóstico DB] Amostra de fotos salvas:`, samplePhotos.rows);
      } else {
        console.log(`📸 [Diagnóstico DB] Nenhuma foto cadastrada na tabela "photos" ainda.`);
      }
    } catch (diagErr) {
      console.warn(`[Diagnóstico DB] Erro ao listar fotos:`, diagErr);
    }

    console.log("🛠️ Sincronização do schema concluída com sucesso.");
  } catch (err) {
    console.error("❌ Falha crítica no bootstrap do banco de dados:", err);
  } finally {
    client.release();
  }
}
