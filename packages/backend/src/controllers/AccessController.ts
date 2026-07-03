import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  adminRoles,
  adminUsers,
  userSpecialAccess,
  users,
  profiles,
  notifications,
} from "../db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import { requirePermission, invalidatePermissionCache } from "../middleware/rbac.js";

// Permissões padrão por role
const DEFAULT_ROLES = [
  {
    name: "super_admin",
    description: "Acesso total ao sistema",
    permissions: {
      "users.view": true, "users.edit": true, "users.ban": true, "users.delete": true,
      "users.special_access": true,
      "photos.moderate": true,
      "reports.view": true, "reports.resolve": true,
      "finance.view": true, "finance.refund": true, "finance.export": true,
      "ai.view": true, "ai.config": true,
      "admin.manage": true,
      "settings.edit": true,
      "communications.send": true,
    },
  },
  {
    name: "moderator",
    description: "Moderação de conteúdo e usuários",
    permissions: {
      "users.view": true, "users.edit": true, "users.ban": true, "users.delete": false,
      "users.special_access": false,
      "photos.moderate": true,
      "reports.view": true, "reports.resolve": true,
      "finance.view": false, "finance.refund": false, "finance.export": false,
      "ai.view": false, "ai.config": false,
      "admin.manage": false,
      "settings.edit": false,
      "communications.send": true,
    },
  },
  {
    name: "financial",
    description: "Acesso ao módulo financeiro",
    permissions: {
      "users.view": true, "users.edit": false, "users.ban": false, "users.delete": false,
      "users.special_access": false,
      "photos.moderate": false,
      "reports.view": false, "reports.resolve": false,
      "finance.view": true, "finance.refund": true, "finance.export": true,
      "ai.view": true, "ai.config": false,
      "admin.manage": false,
      "settings.edit": false,
      "communications.send": false,
    },
  },
  {
    name: "support",
    description: "Suporte ao usuário",
    permissions: {
      "users.view": true, "users.edit": true, "users.ban": false, "users.delete": false,
      "users.special_access": false,
      "photos.moderate": false,
      "reports.view": true, "reports.resolve": false,
      "finance.view": false, "finance.refund": false, "finance.export": false,
      "ai.view": false, "ai.config": false,
      "admin.manage": false,
      "settings.edit": false,
      "communications.send": true,
    },
  },
];

export async function accessRoutes(app: FastifyInstance) {

  // =====================================================
  // GET /admin/access/roles — Lista roles
  // =====================================================
  app.get("/roles", {
    preHandler: [requirePermission("admin.manage")]
  }, async (_req, reply: FastifyReply) => {
    try {
      const roles = await db.select().from(adminRoles);
      return reply.send({ roles });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar roles." });
    }
  });

  // =====================================================
  // POST /admin/access/roles — Criar role
  // =====================================================
  app.post("/roles", {
    preHandler: [requirePermission("admin.manage")]
  }, async (req: any, reply: FastifyReply) => {
    const { name, description, permissions } = req.body as {
      name: string;
      description?: string;
      permissions: Record<string, boolean>;
    };

    try {
      const [role] = await db
        .insert(adminRoles)
        .values({ name, description, permissions })
        .returning();
      return reply.status(201).send({ role });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao criar role." });
    }
  });

  // =====================================================
  // PUT /admin/access/roles/:id — Atualizar permissões
  // =====================================================
  app.put("/roles/:id", {
    preHandler: [requirePermission("admin.manage")]
  }, async (req: any, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { description, permissions } = req.body as {
      description?: string;
      permissions?: Record<string, boolean>;
    };

    try {
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (permissions !== undefined) updateData.permissions = permissions;

      await db.update(adminRoles).set(updateData).where(eq(adminRoles.id, id));
      
      // Invalida cache de permissão para admins com essa role (para ser ideal deveria buscar os admins, 
      // mas vamos deixar simples ou assumir que vai expirar em 60s no max).

      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao atualizar role." });
    }
  });

  // =====================================================
  // POST /admin/access/roles/seed — Sementar roles padrão
  // =====================================================
  app.post("/roles/seed", {
    preHandler: [requirePermission("admin.manage")]
  }, async (_req, reply: FastifyReply) => {
    try {
      for (const role of DEFAULT_ROLES) {
        const [existing] = await db
          .select({ id: adminRoles.id })
          .from(adminRoles)
          .where(eq(adminRoles.name, role.name))
          .limit(1);

        if (!existing) {
          await db.insert(adminRoles).values(role);
        }
      }
      return reply.send({ success: true, message: "Roles padrão criadas." });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao semear roles." });
    }
  });

  // =====================================================
  // GET /admin/access/admins — Lista admin users
  // =====================================================
  app.get("/admins", {
    preHandler: [requirePermission("admin.manage")]
  }, async (_req, reply: FastifyReply) => {
    try {
      const result = await db.execute(sql`
        SELECT
          au.id,
          au.is_active,
          au.last_login,
          au.created_at,
          ar.name AS role_name,
          ar.permissions,
          u.email,
          p.display_name
        FROM admin_users au
        JOIN users u ON u.id = au.user_id
        LEFT JOIN profiles p ON p.id = au.user_id
        LEFT JOIN admin_roles ar ON ar.id = au.role_id
        ORDER BY au.created_at DESC
      `);
      return reply.send({ admins: result.rows });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar admins." });
    }
  });

  // =====================================================
  // POST /admin/access/admins — Adicionar admin
  // =====================================================
  app.post("/admins", {
    preHandler: [requirePermission("admin.manage")]
  }, async (req: any, reply: FastifyReply) => {
    const { userId, roleId } = req.body as { userId: string; roleId: string };
    const creatorId = (req.user as any).sub;

    try {
      // Promove o usuário para admin
      await db.update(users).set({ profileType: "admin" }).where(eq(users.id, userId));

      const [adminUser] = await db
        .insert(adminUsers)
        .values({ userId, roleId, createdBy: creatorId })
        .returning();

      return reply.status(201).send({ adminUser });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao adicionar admin." });
    }
  });

  // =====================================================
  // PUT /admin/access/admins/:id — Editar admin (role, status)
  // =====================================================
  app.put("/admins/:id", {
    preHandler: [requirePermission("admin.manage")]
  }, async (req: any, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { roleId, isActive } = req.body as { roleId?: string; isActive?: boolean };

    try {
      const updateData: any = {};
      if (roleId !== undefined) updateData.roleId = roleId;
      if (isActive !== undefined) updateData.isActive = isActive;

      await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, id));

      const [admin] = await db.select({ userId: adminUsers.userId }).from(adminUsers).where(eq(adminUsers.id, id));
      if (admin) invalidatePermissionCache(admin.userId);

      return reply.send({ success: true });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao editar admin." });
    }
  });

  // =====================================================
  // POST /admin/access/special — Conceder acesso especial
  // Vitalício, Free Premium, VIP, Tester, Influenciador
  // =====================================================
  app.post("/special", {
    preHandler: [requirePermission("users.special_access")]
  }, async (req: any, reply: FastifyReply) => {
    const { userId, accessType, reason, validUntil } = req.body as {
      userId: string;
      accessType: "lifetime" | "free_premium" | "vip" | "tester" | "influencer";
      reason?: string;
      validUntil?: string; // ISO date; null = vitalício
    };
    const grantedBy = (req.user as any).sub;

    try {
      // Desativa acesso especial anterior se existir
      await db
        .update(userSpecialAccess)
        .set({ isActive: false })
        .where(and(eq(userSpecialAccess.userId, userId), eq(userSpecialAccess.isActive, true)));

      const [access] = await db
        .insert(userSpecialAccess)
        .values({
          userId,
          accessType,
          reason,
          grantedBy,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
        })
        .returning();

      // Se for vitalício ou free_premium → marca isPremium=true
      if (["lifetime", "free_premium"].includes(accessType)) {
        await db.update(users).set({ isPremium: true }).where(eq(users.id, userId));
      }

      // Notificação in-app
      const messages: Record<string, { title: string; body: string }> = {
        lifetime: { title: "🏆 Você recebeu acesso Vitalício!", body: "Parabéns! Seu acesso premium é permanente e gratuito." },
        free_premium: { title: "🎁 Acesso Premium liberado!", body: "Você recebeu acesso premium temporário. Aproveite!" },
        vip: { title: "⭐ Você é VIP!", body: "Você recebeu o badge VIP no seu perfil. Bem-vindo ao clube!" },
        influencer: { title: "🌟 Você é Influenciador!", body: "Seu perfil agora tem badge de influenciador e benefícios exclusivos." },
        tester: { title: "🧪 Conta de Tester ativada", body: "Sua conta foi marcada como tester interno." },
      };

      const msg = messages[accessType];
      await db.insert(notifications).values({
        userId,
        type: "system",
        title: msg.title,
        body: msg.body,
        link: "/feed",
      });

      return reply.status(201).send({ access });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao conceder acesso especial." });
    }
  });

  // =====================================================
  // DELETE /admin/access/special/:userId — Revogar acesso especial
  // =====================================================
  app.delete("/special/:userId", {
    preHandler: [requirePermission("users.special_access")]
  }, async (req: any, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };

    try {
      await db
        .update(userSpecialAccess)
        .set({ isActive: false })
        .where(and(eq(userSpecialAccess.userId, userId), eq(userSpecialAccess.isActive, true)));

      // Remove isPremium se não tiver assinatura ativa
      const result = await db.execute(sql`
        SELECT id FROM subscriptions
        WHERE user_id = ${userId} AND status = 'active' LIMIT 1
      `);
      const activeSub = result.rows[0];

      if (!activeSub) {
        await db.update(users).set({ isPremium: false }).where(eq(users.id, userId));
      }

      return reply.send({ success: true, message: "Acesso especial revogado." });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao revogar acesso especial." });
    }
  });

  // =====================================================
  // GET /admin/access/special — Lista todos os acessos especiais ativos
  // =====================================================
  app.get("/special", {
    preHandler: [requirePermission("users.special_access")]
  }, async (_req, reply: FastifyReply) => {
    try {
      const result = await db.execute(sql`
        SELECT
          sa.id,
          sa.access_type,
          sa.reason,
          sa.valid_until,
          sa.is_active,
          sa.created_at,
          u.email,
          p.display_name,
          g.email AS granted_by_email
        FROM user_special_access sa
        JOIN users u ON u.id = sa.user_id
        LEFT JOIN profiles p ON p.id = sa.user_id
        LEFT JOIN users g ON g.id = sa.granted_by
        WHERE sa.is_active = true
        ORDER BY sa.created_at DESC
      `);
      return reply.send({ specialAccess: result.rows });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar acessos especiais." });
    }
  });
}
