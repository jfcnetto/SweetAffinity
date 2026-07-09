import { db } from "./db/index.js";
import { users, blogPosts } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  try {
    // 1. Promove exclusivamente jfcnetto@gmail.com a admin
    await db.update(users)
      .set({ profileType: "admin", status: "approved" })
      .where(eq(users.email, "jfcnetto@gmail.com"));
    console.log("🔑 [DEV] Usuário jfcnetto@gmail.com promovido a administrador (Admin).");

    // 2. Deleta todos os posts
    await db.delete(blogPosts);
    console.log("🧹 [DEV] Todos os artigos do blog foram deletados com sucesso da base de dados!");
    
    // 3. Verifica a contagem
    const remaining = await db.select().from(blogPosts);
    console.log(`🧹 [DEV] Quantidade de artigos no banco após deleção: ${remaining.length}`);
  } catch (err) {
    console.error("⚠️ Erro ao executar tarefas de startup no DB:", err);
  }
}

run();
