import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const cp437ToUtf8: Record<string, string> = {
  "├ú": "ã",
  "├¬": "ê",
  "├Á": "õ",
  "├í": "á",
  "├®": "é",
  "├º": "ç",
  "├ó": "â",
  "├ô": "Ô",
  "├Ü": "Ü",
  "├ì": "Í",
  "├úo": "ão",
  "├Áes": "ões",
  "├¡": "í",
  "├│": "ó",
  "├ë": "É",
  "├┤": "ô",
  "├║": "ú",
  "├ê": "Ê",
  "├ü": "Á",
  "ÔÇ£": "“",
  "ÔÇØ": "”",
  "ÔÇÖ": "’",
  "ÔÇô": "–",
  "ÔÇö": "—"
};

function fixEncoding(text: string | null): string | null {
  if (!text) return text;
  let fixed = text;
  for (const [bad, good] of Object.entries(cp437ToUtf8)) {
    fixed = fixed.split(bad).join(good);
  }
  // Corrige strings literais \n (barra invertida + n) para quebras de linha reais
  fixed = fixed.split('\\n').join('\n');
  return fixed;
}

async function run() {
  const { db } = await import("./index.js");
  const { profiles, blogPosts } = await import("./schema.js");
  const { eq } = await import("drizzle-orm");
  
  console.log("Iniciando correção de codificação no banco de dados...");
  
  // 1. Corrigir perfis
  console.log("Corrigindo perfis...");
  const allProfiles = await db.select().from(profiles);
  let profilesCount = 0;

  for (const profile of allProfiles) {
    let needsUpdate = false;
    const updated: any = {};

    const textFields: (keyof typeof profiles.$inferSelect)[] = [
      'bio', 'seekingDescription', 'displayName', 'profession', 'city', 'state'
    ];

    for (const field of textFields) {
      const val = profile[field];
      if (typeof val === "string" && /[├]/.test(val)) {
        updated[field] = fixEncoding(val);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await db.update(profiles).set(updated).where(eq(profiles.id, profile.id));
      profilesCount++;
    }
  }
  console.log(`Perfis corrigidos: ${profilesCount}`);

  // 2. Corrigir Blog Posts
  console.log("Corrigindo posts do blog...");
  let blogCount = 0;
  try {
    const allPosts = await db.select().from(blogPosts);
    for (const post of allPosts) {
      let needsUpdate = false;
      const updated: any = {};

      const textFields: (keyof typeof blogPosts.$inferSelect)[] = [
        'title', 'content', 'metaDescription'
      ];

      for (const field of textFields) {
        const val = post[field];
        if (typeof val === "string" && /[├]/.test(val)) {
          updated[field] = fixEncoding(val);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await db.update(blogPosts).set(updated).where(eq(blogPosts.id, post.id));
        blogCount++;
      }
    }
  } catch (err: any) {
    console.warn("Tabela blog_posts não existe ou falhou ao ler:", err.message);
  }
  console.log(`Posts de blog corrigidos: ${blogCount}`);

  console.log(`Correção finalizada. Total de tabelas limpas.`);
  process.exit(0);
}

run().catch(console.error);
