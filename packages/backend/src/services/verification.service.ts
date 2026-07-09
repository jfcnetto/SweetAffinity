import { db } from "../db/index.js";
import { profiles, photos } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import sharp from "sharp";
import { ModerationService } from "./moderation.service.js";

export class VerificationService {
  /**
   * Realiza a verificação automática de completude e qualidade do perfil.
   */
  static async verifyProfileCompleteness(profileId: string): Promise<{
    autoApprove: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // 1. Obter dados do perfil
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId));

    if (!profile) {
      return { autoApprove: false, reasons: ["Perfil não encontrado."] };
    }

    // Validações básicas de campos
    if (!profile.displayName || profile.displayName.trim().length < 3) {
      reasons.push("Nome de exibição incompleto ou inválido.");
    }
    if (!profile.bio || profile.bio.trim().length < 20) {
      reasons.push("A biografia deve ter pelo menos 20 caracteres.");
    }
    if (!profile.state || !profile.city) {
      reasons.push("Localização (Estado e Cidade) deve ser informada.");
    }

    // 2. Verificar se o usuário possui foto de perfil aprovada ou pendente
    const userPhotos = await db
      .select()
      .from(photos)
      .where(and(eq(photos.userId, profileId), eq(photos.isPrimary, true)));

    if (userPhotos.length === 0) {
      reasons.push("Foto de perfil principal obrigatória ausente.");
    } else {
      const primaryPhoto = userPhotos[0];
      // Se tivermos integração com IA de moderação/Sharp futuramente, faríamos aqui.
      // Por enquanto, checamos se existe o arquivo associado à foto principal
      if (!primaryPhoto.storagePath) {
        reasons.push("Caminho do arquivo da foto principal inválido.");
      }
    }

    const autoApprove = reasons.length === 0;

    return {
      autoApprove,
      reasons,
    };
  }

  /**
   * Executa a checagem automática e aprova o perfil se elegível,
   * caso contrário envia para a moderação manual.
   */
  static async processProfileVerification(profileId: string) {
    const { autoApprove } = await this.verifyProfileCompleteness(profileId);

    if (autoApprove) {
      // Auto-aprovação instantânea
      await ModerationService.approveProfile(profileId, "system_auto_verify");
      console.log(`[Verification] Perfil ${profileId} auto-aprovado automaticamente pelo sistema.`);
    } else {
      // Caso contrário, vai para a fila manual
      await ModerationService.submitToModeration(profileId);
    }
  }
}
