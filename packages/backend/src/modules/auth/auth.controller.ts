import { AuthService } from "./auth.service.js";
import { authGuard } from "./auth.guard.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import axios from "axios";

export async function authRoutes(app: any) {

  // =====================================================
  // POST /auth/register
  // =====================================================
  app.post("/auth/register", async (req: any, reply: any) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    if (password.length < 8) {
      return reply.status(400).send({ message: "A senha deve ter no mínimo 8 caracteres." });
    }

    try {
      const user = await AuthService.register(email, password);
      const accessToken = AuthService.generateAccessToken(app, user);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      return reply.status(201).send({ user, accessToken, refreshToken });

    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_EXISTS") {
        return reply.status(409).send({ message: "E-mail já cadastrado." });
      }
      throw err; // outros erros viram 500 pelo Fastify
    }
  });

  // =====================================================
  // POST /auth/login
  // =====================================================
  app.post("/auth/login", async (req: any, reply: any) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    try {
      const user = await AuthService.login(email, password);
      const accessToken = AuthService.generateAccessToken(app, user);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      return reply.send({ user, accessToken, refreshToken });

    } catch (err: any) {
      if (err.message === "INVALID_CREDENTIALS") {
        return reply.status(401).send({ message: "E-mail ou senha inválidos." });
      }
      if (err.message === "ACCOUNT_SUSPENDED") {
        return reply.status(403).send({ message: "Conta suspensa. Entre em contato com o suporte." });
      }
      throw err;
    }
  });

  // =====================================================
  // POST /auth/refresh
  // =====================================================
  app.post("/auth/refresh", async (req: any, reply: any) => {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return reply.status(400).send({ message: "refreshToken é obrigatório." });
    }

    try {
      const userId = await AuthService.rotateRefreshToken(refreshToken);
      const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: "15m" });

      return reply.send({ accessToken });

    } catch (err: any) {
      if (
        err.message === "INVALID_REFRESH_TOKEN" ||
        err.message === "REFRESH_TOKEN_EXPIRED"
      ) {
        return reply.status(401).send({ message: "Sessão expirada. Faça login novamente." });
      }
      throw err;
    }
  });

  // =====================================================
  // GET /auth/google/callback
  // =====================================================
  app.get("/auth/google/callback", async (req: any, reply: any) => {
    try {
      // O plugin @fastify/oauth2 injeta getAccessTokenFromAuthorizationCodeFlow() no app.googleOAuth2
      const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
      
      // Busca os dados do usuário no Google
      const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${token.access_token}`
        }
      });
      
      const googleUser = userInfoResponse.data;
      
      // Procura ou cria o usuário na base (Google Login)
      const user = await AuthService.loginWithGoogle(googleUser.email, googleUser.name);
      
      // Gera os nossos tokens
      const accessToken = AuthService.generateAccessToken(app, user);
      const refreshToken = await AuthService.generateRefreshToken(user.id);
      
      // Redireciona de volta para o frontend (passando tokens na URL para o AuthContext capturar)
      const frontendUrl = process.env.APP_URL || "http://localhost:3000";
      return reply.redirect(`${frontendUrl}/?access_token=${accessToken}&refresh_token=${refreshToken}`);

    } catch (err: any) {
      req.log.error(err);
      const frontendUrl = process.env.APP_URL || "http://localhost:3000";
      return reply.redirect(`${frontendUrl}/?auth_error=google_failed`);
    }
  });

  // =====================================================
  // POST /auth/logout
  // =====================================================
  app.post("/auth/logout", async (req: any, reply: any) => {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return reply.status(400).send({ message: "refreshToken é obrigatório." });
    }

    // Revoga o token específico (não precisa estar autenticado via JWT)
    await AuthService.revokeAllRefreshTokens(refreshToken);

    return reply.send({ success: true });
  });

  // =====================================================
  // GET /auth/me  (rota protegida)
  // =====================================================
  app.get("/auth/me", { preHandler: authGuard }, async (req: any, reply: any) => {
    // Busca dados frescos do banco em vez de confiar só no payload do JWT
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        profileType: users.profileType,
        status: users.status,
        isVerified: users.isVerified,
        isPremium: users.isPremium,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.sub))
      .limit(1);

    if (!result[0]) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    return reply.send({ user: result[0] });
  });
}