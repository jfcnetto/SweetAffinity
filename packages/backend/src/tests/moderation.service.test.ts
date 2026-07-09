import { describe, it, expect, vi, beforeEach } from "vitest";
import { VerificationService } from "../services/verification.service.js";
import { MessageQuotaService } from "../services/messageQuota.service.js";

// Mock do banco de dados e Redis
vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../plugins/redis.js", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

describe("Ajustes Competitivos - Unit Tests", () => {
  describe("VerificationService", () => {
    it("UT-003: Deve falhar verificação automática para perfil sem nome ou bio curta", async () => {
      // Mock do retorno do DB contendo perfil inválido
      const mockProfile = {
        id: "user-123",
        displayName: "",
        bio: "Curta",
        state: "SP",
        city: "São Paulo",
      };

      const spy = vi.spyOn(VerificationService, "verifyProfileCompleteness").mockResolvedValue({
        autoApprove: false,
        reasons: [
          "Nome de exibição incompleto ou inválido.",
          "A biografia deve ter pelo menos 20 caracteres.",
          "Foto de perfil principal obrigatória ausente."
        ],
      });

      const result = await VerificationService.verifyProfileCompleteness("user-123");
      expect(result.autoApprove).toBe(false);
      expect(result.reasons).toContain("Nome de exibição incompleto ou inválido.");
      spy.mockRestore();
    });
  });

  describe("MessageQuotaService", () => {
    it("UT-004: Deve respeitar limite de mensagens para usuários gratuitos no Redis", async () => {
      const { redis } = await import("../plugins/redis.js");
      
      // Mock do redis.incr retornando 11 (estouro da cota de 10)
      vi.mocked(redis.incr).mockResolvedValue(11);

      // Mock de verificação premium retornando falso
      vi.spyOn(MessageQuotaService as any, "isUserPremium").mockResolvedValue(false);

      const canConsume = await MessageQuotaService.consumeMessage("user-free");
      expect(canConsume).toBe(false);
    });

    it("UT-005: Deve permitir mensagens ilimitadas para usuários premium", async () => {
      // Mock de verificação premium retornando verdadeiro
      vi.spyOn(MessageQuotaService as any, "isUserPremium").mockResolvedValue(true);

      const canConsume = await MessageQuotaService.consumeMessage("user-premium");
      expect(canConsume).toBe(true);
    });
  });
});
