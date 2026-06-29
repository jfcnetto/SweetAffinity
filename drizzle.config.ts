import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  // Caminho para o seu schema — ajuste se necessário
  schema: "./packages/backend/src/db/schema.ts",

  // Pasta onde as migrations serão geradas
  out: "./packages/backend/src/db/migrations",

  dialect: "postgresql",

  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // Mostra o SQL antes de aplicar
  verbose: true,

  // Pede confirmação antes de aplicar mudanças destrutivas
  strict: true,
});