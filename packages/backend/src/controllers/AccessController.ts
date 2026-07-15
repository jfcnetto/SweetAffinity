import { FastifyInstance, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import {
  adminRoles,
  adminUsers,
  userSpecialAccess,
  users,
  profiles,
  notifications,
  subscriptions,
} from "../db/index.js";
import { eq, and, desc, alias } from "drizzle-orm";
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
      const adminsList = await db
        .select({
          id: adminUsers.id,
          isActive: adminUsers.isActive,
          lastLogin: adminUsers.lastLogin,
          createdAt: adminUsers.createdAt,
          roleName: adminRoles.name,
          permissions: adminRoles.permissions,
          email: users.email,
          displayName: profiles.displayName,
        })
        .from(adminUsers)
        .innerJoin(users, eq(users.id, adminUsers.userId))
        .leftJoin(profiles, eq(profiles.id, adminUsers.userId))
        .leftJoin(adminRoles, eq(adminRoles.id, adminUsers.roleId))
        .orderBy(desc(adminUsers.createdAt));

      return reply.send({ admins: adminsList });
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

      // Associa à role no adminUsers
      const [newAdmin] = await db.insert(adminUsers).values({
        userId,
        roleId,
        createdBy: creatorId,
        isActive: true
      }).returning();

      return reply.status(201).send({ success: true, admin: newAdmin });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao adicionar admin." });
    }
  });

  // =====================================================
  // GET /admin/access/special — Lista acessos especiais
  // =====================================================
  app.get("/special", {
    preHandler: [requirePermission("users.special_access")]
  }, async (_req, reply: FastifyReply) => {
    try {
      const specialAccessList = await db
        .select({
          id: userSpecialAccess.id,
          userId: userSpecialAccess.userId,
          grantedBy: userSpecialAccess.grantedBy,
          reason: userSpecialAccess.reason,
          expiresAt: userSpecialAccess.expiresAt,
          createdAt: userSpecialAccess.createdAt,
          userEmail: users.email,
          userDisplayName: profiles.displayName,
        })
        .from(userSpecialAccess)
        .innerJoin(users, eq(users.id, userSpecialAccess.userId))
        .leftJoin(profiles, eq(profiles.id, userSpecialAccess.userId))
        .orderBy(desc(userSpecialAccess.createdAt));

      return reply.send({ specialAccess: specialAccessList });
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ message: "Erro ao listar accessos especiais." });
    }
  });
}
