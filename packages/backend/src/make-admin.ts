import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  try {
    // Promove exclusivamente jfcnetto@gmail.com a admin
    await db.update(users)
      .set({ profileType: "admin", status: "active" })
      .where(eq(users.email, "jfcnetto@gmail.com"));
    console.log("[DEV] Usuário jfcnetto@gmail.com promovido a admin.");
  } catch (err) {
    console.error("Erro ao executar make-admin:", err);
  }
}

run();
