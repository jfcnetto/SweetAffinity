import { AuthService } from "./auth.service.js";
import { authGuard } from "./auth.guard.js";
import { db } from "../../db/index.js";
import { users, photos, profiles, notifications } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import axios from "axios";
import { EmailService } from "../../services/EmailService.js";

export async function authRoutes(app: any) {

  // =====================================================
  // POST /auth/register
  // =====================================================
  app.post("/auth/register", async (req: any, reply: any) => {
    const { email, password, ...profileFields } = req.body ?? {};

    if (!email || !password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    if (password.length < 8) {
      return reply.status(400).send({ message: "A senha deve ter no mínimo 8 caracteres." });
    }

    try {
      const user = await AuthService.register(email, password);

      // Mapeamento correto para o Enum de Tipo de Relacionamento do banco
      const profileTypeMap: { [key: string]: 'baby' | 'daddy' | 'mommy' } = {
        'Baby': 'baby',
        'Daddy': 'daddy',
        'Mommy': 'mommy',
      };
      
      const relationshipType = profileTypeMap[profileFields.profile_type] || 'baby';

      // Cria a linha correspondente do perfil (RN-001) para que o feed não dê 404
      await db.insert(profiles).values({
        id: user.id,
        displayName: profileFields.display_name || email.split('@')[0],
        birthDate: profileFields.birth_date || "2000-01-01",
        relationshipType,
        gender: profileFields.gender || "other",
        state: profileFields.state || null,
        city: profileFields.city || null,
        profession: profileFields.profession || null,
        education: profileFields.education || null,
        incomeRange: profileFields.income_range || null,
        maritalStatus: profileFields.marital_status ? profileFields.marital_status.toLowerCase() : null,
        heightRange: profileFields.height_range || null,
        ethnicity: profileFields.ethnicity || null,
        hairColor: profileFields.hair_color || null,
        eyeColor: profileFields.eye_color || null,
        smoking: profileFields.smoking ? profileFields.smoking.toLowerCase() : null,
        drinking: profileFields.drinking ? profileFields.drinking.toLowerCase() : null,
      });

      // Cria notificação de boas-vindas
      await db.insert(notifications).values({
        userId: user.id,
        type: "system",
        title: "✨ Bem-vindo!",
        body: "Complete seu perfil adicionando suas fotos para conseguir matches.",
        link: "/register/photos",
      });

      // Gera token de verificação por e-mail (expira em 24h)
      const verificationToken = app.jwt.sign(
        { sub: user.id, type: "verification" },
        { expiresIn: "24h" }
      );

      // Envia o e-mail
      await EmailService.sendVerificationEmail(email.toLowerCase().trim(), verificationToken);

      return reply.status(201).send({
        message: "VERIFICATION_EMAIL_SENT",
        email: email.toLowerCase().trim()
      });

    } catch (err: any) {
      if (err.message === "EMAIL_ALREADY_EXISTS") {
        return reply.status(409).send({ message: "E-mail já cadastrado." });
      }
      throw err; // outros erros viram 500 pelo Fastify
    }
  });

  // =====================================================
  // GET /auth/verify — Confirmação de e-mail por Token
  // =====================================================
  app.get("/auth/verify", async (req: any, reply: any) => {
    const { token } = req.query ?? {};

    if (!token) {
      return reply.status(400).send({ message: "Token de verificação ausente." });
    }

    try {
      const payload = app.jwt.verify(token) as { sub: string; type: string };

      if (payload.type !== "verification") {
        return reply.status(400).send({ message: "Token inválido." });
      }

      const userId = payload.sub;

      const [updatedUser] = await db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return reply.status(404).send({ message: "Usuário não encontrado." });
      }

      // Gera os tokens de login reais após verificação
      const accessToken = AuthService.generateAccessToken(app, updatedUser);
      const refreshToken = await AuthService.generateRefreshToken(updatedUser.id);

      return reply.send({
        success: true,
        user: updatedUser,
        accessToken,
        refreshToken
      });

    } catch (err) {
      app.log.error(err);
      return reply.status(400).send({ message: "Token de verificação inválido ou expirado." });
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

      if (!user.isVerified) {
        return reply.status(403).send({
          message: "EMAIL_NOT_VERIFIED",
          email: user.email
        });
      }

      const accessToken = AuthService.generateAccessToken(app, user);
      const refreshToken = await AuthService.generateRefreshToken(user.id);

      // Auto-create profile if missing (self-healing for old test accounts)
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
        
      if (!profile) {
        await db.insert(profiles).values({
          id: user.id,
          displayName: user.email.split('@')[0],
          birthDate: "2000-01-01",
          relationshipType: "baby",
        });
      }

      // Verifica se o usuário já tem fotos enviadas
      const userPhotos = await db
        .select({ id: photos.id })
        .from(photos)
        .where(eq(photos.userId, user.id))
        .limit(1);
      const hasPhotos = userPhotos.length > 0;

      // Verifica se o cadastro está completo (se tem cidade e estado preenchidos)
      const hasCompletedProfile = profile && profile.city !== null && profile.state !== null;



      return reply.send({ 
        user: { ...user, hasPhotos, hasCompletedProfile }, 
        accessToken, 
        refreshToken 
      });

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
      const { userId, newRefreshToken } = await AuthService.rotateRefreshToken(refreshToken);
      const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: "15m" });

      return reply.send({ accessToken, refreshToken: newRefreshToken });

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
      const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "https://sweet-affinity-frontend.vercel.app";
      return reply.redirect(`${frontendUrl}/?access_token=${accessToken}&refresh_token=${refreshToken}`);

    } catch (err: any) {
      req.log.error(err);
      const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "https://sweet-affinity-frontend.vercel.app";
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

    // Auto-create profile if missing (self-healing for old test accounts)
    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.user.sub))
      .limit(1);
      
    if (!profile) {
      const [newProfile] = await db.insert(profiles).values({
        id: req.user.sub,
        displayName: result[0].email.split('@')[0],
        birthDate: "2000-01-01",
        relationshipType: "baby",
      }).returning();
      profile = newProfile;
    }

    // Verifica se o usuário tem fotos
    const userPhotos = await db
      .select({ id: photos.id, storagePath: photos.storagePath, isPrimary: photos.isPrimary })
      .from(photos)
      .where(eq(photos.userId, req.user.sub));
      
    const hasPhotos = userPhotos.length > 0;
    const primaryPhoto = userPhotos.find(p => p.isPrimary) || userPhotos[0];
    
    // Resolve URL pública do MinIO
    const MINIO_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000/sweetaffinity-media";
    const primaryPhotoUrl = primaryPhoto ? `${MINIO_URL}/${primaryPhoto.storagePath}` : null;

    // Verifica se o cadastro está completo (se tem cidade e estado preenchidos)
    const hasCompletedProfile = profile && profile.city !== null && profile.state !== null;

    return reply.send({ 
      user: { 
        ...result[0], 
        hasPhotos, 
        hasCompletedProfile, 
        primaryPhotoUrl 
      } 
    });
  });
}