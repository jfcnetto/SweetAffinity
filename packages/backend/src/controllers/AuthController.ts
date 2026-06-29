import { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import { users, profiles } from "../../db/schema.js";
import { AuthService } from "./auth.service.js";

// =====================================================
// TYPES
// =====================================================

interface RegisterBody {
  email: string;
  password: string;
  profileType?: "Baby" | "Daddy" | "Mommy";
  displayName?: string;
  birthDate?: string;
  state?: string;
  city?: string;
  gender?: "male" | "female" | "other";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  heightRange?: string;
  ethnicity?: string;
  hairColor?: string;
  eyeColor?: string;
  smoking?: "yes" | "no" | "occasionally";
  drinking?: "yes" | "no" | "occasionally";
  education?: string;
  profession?: string;
  incomeRange?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

// =====================================================
// HELPER — remove campos sensíveis antes de retornar
// =====================================================

function sanitizeUser(user: Record<string, any>) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// =====================================================
// PLUGIN
// =====================================================

export const authRoutes: FastifyPluginAsync = async (fastify) => {

  // ─────────────────────────────────────────────────
  // POST /auth/register
  // ─────────────────────────────────────────────────
  fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
    const body = request.body;

    // FIX 1: validação mais completa
    if (!body?.email || !body?.password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    if (body.password.length < 8) {
      return reply.status(400).send({ message: "A senha deve ter no mínimo 8 caracteres." });
    }

    // FIX 2: validação de +18 anos
    if (body.birthDate) {
      const birth = new Date(body.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const realAge =
        monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())
          ? age - 1
          : age;

      if (realAge < 18) {
        return reply.status(400).send({ message: "Você deve ter 18 anos ou mais para se cadastrar." });
      }
    }

    const email = body.email.toLowerCase().trim();

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length) {
      return reply.status(409).send({ message: "E-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(body.password, 12); // FIX 3: custo 12 (não 10)

    const result = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          profileType: body.profileType ?? null,
          status: "pending",
        })
        .returning();

      await tx.insert(profiles).values({
        id: createdUser.id,
        displayName: body.displayName ?? null,
        birthDate: body.birthDate ?? null,
        state: body.state ?? null,
        city: body.city ?? null,
        gender: body.gender ?? null,
        maritalStatus: body.maritalStatus ?? null,
        heightRange: body.heightRange ?? null,
        ethnicity: body.ethnicity ?? null,
        hairColor: body.hairColor ?? null,
        eyeColor: body.eyeColor ?? null,
        smoking: body.smoking ?? null,
        drinking: body.drinking ?? null,
        education: body.education ?? null,
        profession: body.profession ?? null,
        incomeRange: body.incomeRange ?? null,
      });

      return createdUser;
    });

    const accessToken = AuthService.generateAccessToken(fastify, result);
    const refreshToken = await AuthService.generateRefreshToken(result.id);

    // FIX 4: NUNCA retornar passwordHash ao cliente
    return reply.status(201).send({
      message: "Usuário registrado com sucesso.",
      accessToken,
      refreshToken,
      user: sanitizeUser(result),
    });
  });

  // ─────────────────────────────────────────────────
  // POST /auth/login
  // ─────────────────────────────────────────────────
  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    const body = request.body;

    if (!body?.email || !body?.password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    const email = body.email.toLowerCase().trim();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // FIX 5: mesma mensagem para email inexistente e senha errada
    // (evitar user enumeration attack)
    if (!user.length) {
      return reply.status(401).send({ message: "E-mail ou senha inválidos." });
    }

    const foundUser = user[0];

    // FIX 6: verificar se conta está banida/suspensa antes de validar senha
    if (foundUser.status === "banned") {
      return reply.status(403).send({ message: "Esta conta foi suspensa. Entre em contato com o suporte." });
    }

    const validPassword = await bcrypt.compare(body.password, foundUser.passwordHash);

    if (!validPassword) {
      return reply.status(401).send({ message: "E-mail ou senha inválidos." });
    }

    // FIX 7: atualizar lastLoginAt no banco
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, foundUser.id));

    const accessToken = AuthService.generateAccessToken(fastify, foundUser);
    const refreshToken = await AuthService.generateRefreshToken(foundUser.id);

    // FIX 4: NUNCA retornar passwordHash
    return reply.send({
      message: "Login realizado com sucesso.",
      accessToken,
      refreshToken,
      user: sanitizeUser(foundUser),
    });
  });

  // ─────────────────────────────────────────────────
  // POST /auth/refresh
  // ─────────────────────────────────────────────────
  fastify.post<{ Body: RefreshBody }>("/refresh", async (request, reply) => {
    const { refreshToken } = request.body;

    if (!refreshToken) {
      return reply.status(400).send({ message: "refreshToken é obrigatório." });
    }

    // FIX 8: rotateRefreshToken deve retornar { userId, newRefreshToken }
    // e o endpoint deve retornar ambos os tokens
    const { userId, newRefreshToken } = await AuthService.rotateRefreshToken(refreshToken);

    const accessToken = fastify.jwt.sign(
      { sub: userId },
      { expiresIn: "15m" }
    );

    return reply.send({
      accessToken,
      refreshToken: newRefreshToken, // FIX 9: retornar o novo refresh token rotacionado
    });
  });

  // ─────────────────────────────────────────────────
  // GET /auth/me
  // ─────────────────────────────────────────────────
  // FIX 10: forma correta de usar jwtVerify no Fastify v4
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate], // usa o decorator, não preHandler inline
    },
    async (request, reply) => {
      // FIX 11: buscar dados atuais do banco, não só o payload do JWT
      const payload = request.user as { sub: string };

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user.length) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      return reply.send({ user: sanitizeUser(user[0]) });
    }
  );

  // ─────────────────────────────────────────────────
  // POST /auth/logout
  // ─────────────────────────────────────────────────
  fastify.post(
    "/logout",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      // Invalidar o refresh token no Redis/banco
      const payload = request.user as { sub: string };
      await AuthService.revokeRefreshTokens(payload.sub);

      return reply.send({ message: "Logout realizado com sucesso." });
    }
  );
};