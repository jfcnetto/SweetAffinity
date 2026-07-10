import { db } from "../../db/index.js";
import { users, refreshTokens, profiles, notifications } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// =====================================================
// AUTH SERVICE
// =====================================================

export class AuthService {

  // =====================================================
  // REGISTER
  // =====================================================
  static async register(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    // FIX 1: try/catch para tratar email duplicado com mensagem limpa
    // em vez de vazar o erro raw do Postgres ("Failed query")
    try {
      const [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase().trim(),
          passwordHash,
          // role e status têm default no schema — não precisam ser passados
        })
        .returning({
          id: users.id,
          email: users.email,
          profileType: users.profileType,
          status: users.status,
          isVerified: users.isVerified,
          isPremium: users.isPremium,
          createdAt: users.createdAt,
          // passwordHash deliberadamente omitido
        });

      return user;
    } catch (err: any) {
      // Código 23505 = unique_violation (email duplicado)
      // Drizzle wraps the error, so we also check err.message or err.cause
      if (err.code === "23505" || (err.message && err.message.includes("duplicate key value violates unique constraint \"users_email_idx\""))) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
      throw err;
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================
  static async login(email: string, password: string) {
    // FIX 2: trocar db.query.users.findFirst() por db.select()
    // db.query.* exige que o schema seja passado na inicialização do Drizzle
    // em db/index.ts — se não estiver configurado, retorna undefined silenciosamente.
    // db.select() funciona sempre.
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    const user = result[0];

    // FIX 3: mesma mensagem para "não existe" e "senha errada"
    // evita user enumeration attack (saber se email está cadastrado)
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (user.status === "banned" || user.status === "suspended") {
      throw new Error("ACCOUNT_SUSPENDED");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // FIX 4: retornar sem passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  // =====================================================
  // GOOGLE LOGIN (OAuth)
  // =====================================================
  static async loginWithGoogle(email: string, name?: string) {
    const cleanEmail = email.toLowerCase().trim();

    // Busca usuário existente
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    let user = result[0];

    if (!user) {
      // Cria um usuário novo caso não exista
      // A senha recebe um hash aleatório impossível de descobrir, já que o login será via Google.
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email: cleanEmail,
          passwordHash,
          isVerified: true, // Google logins are pre-verified
        })
        .returning();
      
      // Cria perfil básico padrão no Google Login (RN-001) para evitar quebras de banco
      await db.insert(profiles).values({
        id: newUser.id,
        displayName: name || cleanEmail.split('@')[0],
        birthDate: "2000-01-01",
        relationshipType: "baby", // valor padrão
      });

      // Cria notificação de boas-vindas
      await db.insert(notifications).values({
        userId: newUser.id,
        type: "system",
        title: "✨ Bem-vindo!",
        body: "Complete seu perfil adicionando suas fotos para conseguir matches.",
        link: "/register/photos",
      });

      user = newUser;
    } else {
      if (user.status === "banned" || user.status === "suspended") {
        throw new Error("ACCOUNT_SUSPENDED");
      }
      
      // Remove passwordHash pra retornar safeUser
      const { passwordHash: _, ...safeUser } = user as any;
      user = safeUser;
    }

    return user;
  }

  // =====================================================
  // ACCESS TOKEN (JWT)
  // =====================================================
  static generateAccessToken(app: any, user: any) {
    return app.jwt.sign(
      {
        sub: user.id,
        profileType: user.profileType,
      },
      {
        expiresIn: "15m",
      }
    );
  }

  // =====================================================
  // REFRESH TOKEN (DB STORAGE)
  // =====================================================
  static async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(64).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await db.insert(refreshTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  // =====================================================
  // ROTATE REFRESH TOKEN
  // Retorna { userId, newRefreshToken } — conforme AuthController.ts
  // =====================================================
  static async rotateRefreshToken(oldToken: string) {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, oldToken))
      .limit(1);

    const stored = result[0];

    if (!stored || stored.revokedAt !== null) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (new Date(stored.expiresAt) < new Date()) {
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    // Revogar o token usado (rotation — single use)
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, stored.id));

    // Gerar novo refresh token (rotacionado)
    const newRefreshToken = await AuthService.generateRefreshToken(stored.userId);

    return { userId: stored.userId, newRefreshToken };
  }

  // =====================================================
  // REVOKE ALL TOKENS (logout completo)
  // Alias: revokeRefreshTokens (para compatibilidade com AuthController.ts)
  // =====================================================
  static async revokeAllRefreshTokens(userId: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, userId));
  }

  // Alias para compatibilidade com AuthController.ts
  static revokeRefreshTokens = AuthService.revokeAllRefreshTokens;
}
