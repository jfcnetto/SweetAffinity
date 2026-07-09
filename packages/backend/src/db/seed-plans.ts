import { db } from "./index.js";
import { plans } from "./schema.js";

async function main() {
  console.log("🌱 Purging old plans and starting clean seed...");
  await db.delete(plans);

  const data = [
    // --- MENSAL ---
    {
      name: "Gold",
      priceCents: 9900,
      billingPeriod: "monthly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "3 Destaques de perfil por mês",
        "Acesso aos filtros de busca básicos",
      ],
      stripePriceId: "price_gold_monthly_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 0,
    },
    {
      name: "Platinum",
      priceCents: 24900,
      billingPeriod: "monthly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "10 Destaques de perfil por mês",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_platinum_monthly_mock",
      isActive: true,
      isHighlighted: true,
      discountPercentage: 0,
    },
    {
      name: "Elite",
      priceCents: 49900,
      billingPeriod: "monthly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "Destaque de perfil ilimitado",
        "Suporte prioritário 24/7",
        "Modo Invisível completo",
        "Acesso antecipado a novas conexões",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_elite_monthly_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 0,
    },
    // --- TRIMESTRAL ---
    {
      name: "Gold",
      priceCents: 24900,
      billingPeriod: "quarterly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "3 Destaques de perfil por mês",
        "Acesso aos filtros de busca básicos",
      ],
      stripePriceId: "price_gold_quarterly_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 15,
    },
    {
      name: "Platinum",
      priceCents: 59900,
      billingPeriod: "quarterly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "10 Destaques de perfil por mês",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_platinum_quarterly_mock",
      isActive: true,
      isHighlighted: true,
      discountPercentage: 20,
    },
    {
      name: "Elite",
      priceCents: 119900,
      billingPeriod: "quarterly",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "Destaque de perfil ilimitado",
        "Suporte prioritário 24/7",
        "Modo Invisível completo",
        "Acesso antecipado a novas conexões",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_elite_quarterly_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 20,
    },
    // --- SEMESTRAL ---
    {
      name: "Gold",
      priceCents: 44900,
      billingPeriod: "semi_annual",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "3 Destaques de perfil por mês",
        "Acesso aos filtros de busca básicos",
      ],
      stripePriceId: "price_gold_semiannual_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 25,
    },
    {
      name: "Platinum",
      priceCents: 109900,
      billingPeriod: "semi_annual",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "10 Destaques de perfil por mês",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_platinum_semiannual_mock",
      isActive: true,
      isHighlighted: true,
      discountPercentage: 30,
    },
    {
      name: "Elite",
      priceCents: 219900,
      billingPeriod: "semi_annual",
      features: [
        "Chat ilimitado sem limite de cota mensal",
        "Destaque de perfil ilimitado",
        "Suporte prioritário 24/7",
        "Modo Invisível completo",
        "Acesso antecipado a novas conexões",
        "Acesso completo a todos os filtros avançados",
        "Selo de verificação premium exclusivo",
      ],
      stripePriceId: "price_elite_semiannual_mock",
      isActive: true,
      isHighlighted: false,
      discountPercentage: 30,
    },
  ];

  for (const item of data) {
    try {
      await db.insert(plans).values(item).onConflictDoNothing();
      console.log(`✅ Plano "${item.name}" inserido ou já existente.`);
    } catch (err) {
      console.error(`❌ Erro ao inserir plano "${item.name}":`, err);
    }
  }

  console.log("🌱 Seed de planos finalizado.");
}

main().catch((err) => {
  console.error("❌ Erro fatal durante o seed:", err);
});
