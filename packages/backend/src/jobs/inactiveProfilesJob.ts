import { db } from "../db/index.js";
import { profiles } from "../db/schema.js";
import { lte, and, isNull } from "drizzle-orm";

export async function runInactiveProfilesJob() {
  console.log("[Job] Iniciando verificação de perfis inativos (há mais de 90 dias)...");

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    // 1. Encontrar e reduzir o score de popularidade dos perfis inativos
    const result = await db
      .update(profiles)
      .set({
        // Reduz o score de popularidade pela metade para diminuir sua visibilidade nas buscas
        popularityScore: 0,
      })
      .where(
        and(
          lte(profiles.lastActiveAt, ninetyDaysAgo),
          isNull(profiles.deletedAt)
        )
      );

    console.log(`[Job] Perfis inativos processados e penalizados no ranking.`);
  } catch (err) {
    console.error("[Job] Erro ao executar job de perfis inativos:", err);
  }
}
