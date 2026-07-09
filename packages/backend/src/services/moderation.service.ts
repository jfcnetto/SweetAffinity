import { db } from "../db/index.js";
import { profiles, profileModerationQueue, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { EmailService } from "./EmailService.js";

export class ModerationService {
  /**
   * Submete ou atualiza um perfil na fila de moderação.
   */
  static async submitToModeration(profileId: string) {
    // 1. Atualiza o status do perfil para pending
    await db
      .update(profiles)
      .set({ moderationStatus: "pending" })
      .where(eq(profiles.id, profileId));

    // 2. Insere na fila de moderação
    await db.insert(profileModerationQueue).values({
      profileId,
      status: "pending",
    });

    console.log(`[Moderation] Perfil ${profileId} enviado para a fila de moderação.`);
  }

  /**
   * Aprova um perfil de usuário.
   */
  static async approveProfile(profileId: string, reviewedBy: string) {
    // 1. Atualizar status na tabela profiles
    await db
      .update(profiles)
      .set({ moderationStatus: "approved" })
      .where(eq(profiles.id, profileId));

    // 2. Atualizar status na fila
    await db
      .update(profileModerationQueue)
      .set({
        status: "approved",
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(profileModerationQueue.profileId, profileId));

    // Buscar e-mail do usuário para notificar
    const [userData] = await db
      .select({
        email: users.email,
        displayName: profiles.displayName,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.id, users.id))
      .where(eq(profiles.id, profileId));

    // Enviar e-mail de notificação de aprovação
    if (userData && userData.email) {
      await EmailService.sendApprovalEmail(userData.email, userData.displayName);
    }

    console.log(`[Moderation] Perfil ${profileId} aprovado pelo admin ${reviewedBy}.`);
  }

  /**
   * Rejeita um perfil de usuário.
   */
  static async rejectProfile(profileId: string, reason: string, reviewedBy: string) {
    // 1. Atualizar status na tabela profiles
    await db
      .update(profiles)
      .set({ moderationStatus: "rejected" })
      .where(eq(profiles.id, profileId));

    // 2. Atualizar status na fila
    await db
      .update(profileModerationQueue)
      .set({
        status: "rejected",
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: reason,
      })
      .where(eq(profileModerationQueue.profileId, profileId));

    // Buscar dados do usuário para notificar
    const [userData] = await db
      .select({
        email: users.email,
        displayName: profiles.displayName,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.id, users.id))
      .where(eq(profiles.id, profileId));

    if (userData && userData.email) {
      await EmailService.sendRejectionEmail(userData.email, userData.displayName, reason);
    }

    console.log(`[Moderation] Perfil ${profileId} rejeitado pelo admin ${reviewedBy}. Razão: ${reason}`);
  }
}
