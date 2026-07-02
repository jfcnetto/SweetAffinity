import { z } from "zod";

export const createProfileSchema = z.object({
  displayName: z.string().min(3).max(50),
  birthDate: z.string().refine((val) => {
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18; // RN-002: Validação 18 anos
  }, "Usuário deve ter 18 anos ou mais."),
  
  gender: z.string().max(30).optional(),
  relationshipType: z.enum(["baby", "daddy", "mommy"]), // RN-003
  
  state: z.string().length(2), // UF
  city: z.string().max(100),
  
  bio: z.string().max(1000).optional(),
  profession: z.string().max(100).optional(),
  education: z.string().optional(),
  
  // RN-004: income_range condicional (Daddy/Mommy)
  incomeRange: z.string().optional().or(z.null()), 
  
  heightRange: z.string().optional(),
  ethnicity: z.string().max(50).optional(),
  hairColor: z.string().max(30).optional(),
  eyeColor: z.string().max(30).optional(),
  
  smoking: z.enum(["yes", "no", "occasionally"]).optional(),
  drinking: z.enum(["yes", "no", "occasionally"]).optional(),
  
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  seekingDescription: z.string().max(500).optional(),
}).refine((data) => {
  if ((data.relationshipType === "daddy" || data.relationshipType === "mommy") && !data.incomeRange) {
    return false; // RN-004: Obrigatório para Daddy/Mommy
  }
  return true;
}, {
  message: "incomeRange é obrigatório para perfis Daddy ou Mommy.",
  path: ["incomeRange"]
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;