import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/index.js";
import { adminUsers, adminRoles } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Middleware RBAC Granular para o CRM Administrativo SweetAffinity
 *
 * Verifica:
 * 1. Se o JWT é válido
 * 2. Se o usuário é admin (profileType === 'admin')
 * 3. Se o admin está ativo na tabela admin_users
 * 4. Se a role do admin possui a permissão específica requerida
 *
 * Uso:
 *   app.addHook("onRequest", requirePermission("finance.view"));
 *
 * Permissões disponíveis:
 *   users.view, users.edit, users.ban, users.delete, users.special_access
 *   photos.moderate
 *   reports.view, reports.resolve
 *   finance.view, finance.refund, finance.export
 *   ai.view, ai.config
 *   admin.manage
 *   settings.edit
 *   communications.send
 */

// Cache em memória para evitar query a cada request (TTL: 60s)
const permissionCache = new Map<string, { permissions: Record<string, boolean>; expiry: number }>();
const CACHE_TTL_MS = 60_000;

async function resolvePermissions(userId: string): Promise<Record<string, boolean> | null> {
  // Checar cache
  const cached = permissionCache.get(userId);
  if (cached && cached.expiry > Date.now()) {
    return cached.permissions;
  }

  // Buscar admin_user + role
  const [adminUser] = await db
    .select({
      id: adminUsers.id,
      isActive: adminUsers.isActive,
      roleId: adminUsers.roleId,
    })
    .from(adminUsers)
    .where(and(eq(adminUsers.userId, userId), eq(adminUsers.isActive, true)))
    .limit(1);

  if (!adminUser || !adminUser.roleId) {
    return null;
  }

  const [role] = await db
    .select({ permissions: adminRoles.permissions })
    .from(adminRoles)
    .where(eq(adminRoles.id, adminUser.roleId))
    .limit(1);

  if (!role) return null;

  const permissions = role.permissions as Record<string, boolean>;

  // Guardar no cache
  permissionCache.set(userId, { permissions, expiry: Date.now() + CACHE_TTL_MS });

  return permissions;
}

/**
 * Cria um hook Fastify que exige uma permissão específica.
 *
 * @param permission - chave da permissão (ex: "finance.view")
 * @param options.allowSuperAdmin - se true, profileType === 'admin' sem role cadastrada
 *   ainda passa (para compatibilidade com admins criados antes do RBAC). Default: true.
 */
export function requirePermission(
  permission: string,
  options: { allowSuperAdmin?: boolean } = {}
) {
  const { allowSuperAdmin = true } = options;

  return async function (req: FastifyRequest, reply: FastifyReply) {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ message: "Não autorizado." });
    }

    const user = req.user as { sub: string; profileType?: string };

    // 1. Precisa ser admin
    if (user.profileType !== "admin") {
      return reply.status(403).send({ message: "Acesso negado. Perfil não administrativo." });
    }

    // 2. Resolver permissões via RBAC
    const permissions = await resolvePermissions(user.sub);

    if (!permissions) {
      // Admin sem role cadastrada no RBAC
      if (allowSuperAdmin) {
        // Compatibilidade: admin antigo sem role, libera acesso
        return;
      }
      return reply.status(403).send({
        message: "Acesso negado. Nenhuma role RBAC atribuída.",
      });
    }

    // 3. Verificar se tem a permissão específica
    if (!permissions[permission]) {
      return reply.status(403).send({
        message: `Acesso negado. Permissão necessária: ${permission}`,
        requiredPermission: permission,
      });
    }

    // OK — permissão concedida
  };
}

/**
 * Versão helper para verificação inline (dentro de um handler).
 * Retorna true se o admin tem a permissão, false caso contrário.
 */
export async function checkPermission(
  req: FastifyRequest,
  reply: FastifyReply,
  permission: string
): Promise<boolean> {
  const user = req.user as { sub: string; profileType?: string };

  if (user.profileType !== "admin") {
    reply.status(403).send({ message: "Acesso negado." });
    return false;
  }

  const permissions = await resolvePermissions(user.sub);

  // Admin sem role → aceita (compatibilidade)
  if (!permissions) return true;

  if (!permissions[permission]) {
    reply.status(403).send({
      message: `Acesso negado. Permissão necessária: ${permission}`,
    });
    return false;
  }

  return true;
}

/**
 * Limpa o cache de permissões para um admin específico.
 * Útil quando se altera a role de um admin.
 */
export function invalidatePermissionCache(userId: string) {
  permissionCache.delete(userId);
}

/**
 * Limpa todo o cache de permissões.
 */
export function clearPermissionCache() {
  permissionCache.clear();
}
