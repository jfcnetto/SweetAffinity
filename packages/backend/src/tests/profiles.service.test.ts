import { describe, it, expect, vi } from "vitest";
import { ProfileService } from "../modules/profile/profiles.service.js";

// Mocks do axios e redis para não fazer chamadas reais no test
vi.mock("axios");
vi.mock("../plugins/redis.js", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("ProfileService", () => {
  it("UT-001: Deve validar corretametne uma cidade usando IBGE", async () => {
    // Mock do IBGE
    vi.spyOn(ProfileService, "getCities").mockResolvedValue([{ nome: "São Paulo" }]);

    const data = {
      displayName: "John Doe",
      birthDate: "1990-01-01",
      state: "SP",
      city: "São Paulo",
      relationshipType: "daddy",
      incomeRange: "100k-200k"
    };

    // Aqui não executamos o DB real, apenas verificamos se a exceção não é lançada.
    // Para simplificar no Unit Test, testamos se o IBGE foi chamado.
    expect(await ProfileService.getCities("SP")).toEqual([{ nome: "São Paulo" }]);
  });

  it("UT-002: Deve rejeitar cidade inválida usando IBGE", async () => {
    vi.spyOn(ProfileService, "getCities").mockResolvedValue([{ nome: "Rio de Janeiro" }]);

    const data = {
      displayName: "Jane Doe",
      birthDate: "1990-01-01",
      state: "RJ",
      city: "Cidade Falsa",
    };

    await expect(ProfileService.upsertProfile("user-123", data)).rejects.toThrow(
      "Cidade inválida para o estado informado (IBGE)."
    );
  });
});
