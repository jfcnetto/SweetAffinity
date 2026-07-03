import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis do arquivo .env
dotenv.config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL não está configurada no .env do backend.");
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.log("ℹ️ Uso: node promote-user.js <email-do-usuario>");
  console.error("❌ Por favor, informe o e-mail do usuário cadastrado que deseja tornar Admin.");
  process.exit(1);
}

const { Client } = pg;
const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("🔌 Conectado ao banco de dados...");

    // 1. Busca o usuário pelo e-mail
    const userRes = await client.query("SELECT id, email, profile_type FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    
    if (userRes.rows.length === 0) {
      console.error(`❌ Usuário com o e-mail '${email}' não foi encontrado no banco de dados.`);
      console.log("💡 Primeiro, faça o cadastro normalmente na tela inicial do site (localhost:3000), depois rode este script.");
      await client.end();
      process.exit(1);
    }

    const user = userRes.rows[0];
    const userId = user.id;

    // 2. Garante que as roles padrão estão inseridas no banco
    console.log("🌱 Verificando papéis administrativos (Admin Roles)...");
    
    // Inserção da Role "Super Admin" caso não exista
    let superAdminRoleId;
    const roleCheck = await client.query("SELECT id FROM admin_roles WHERE name = $1", ["Super Admin"]);
    
    if (roleCheck.rows.length === 0) {
      const permissions = [
        "admin.view",
        "admin.manage",
        "finance.view",
        "finance.refund",
        "ai.view",
        "ai.config",
        "users.view",
        "users.edit",
        "users.ban",
        "users.special_access",
        "communications.send",
        "settings.edit"
      ];
      
      const insertRoleRes = await client.query(
        "INSERT INTO admin_roles (id, name, description, permissions, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING id",
        ["Super Admin", "Acesso total ao sistema de CRM e configurações", JSON.stringify(permissions)]
      );
      superAdminRoleId = insertRoleRes.rows[0].id;
      console.log("✅ Papel 'Super Admin' criado!");
    } else {
      superAdminRoleId = roleCheck.rows[0].id;
      console.log("✅ Papel 'Super Admin' já existe no banco.");
    }

    // 3. Atualiza o tipo de perfil do usuário para 'admin'
    await client.query("UPDATE users SET profile_type = 'admin' WHERE id = $1", [userId]);
    console.log(`👤 Perfil do usuário atualizado para 'admin' no banco.`);

    // 4. Cria ou ativa o registro na tabela admin_users
    const adminCheck = await client.query("SELECT id FROM admin_users WHERE user_id = $1", [userId]);
    
    if (adminCheck.rows.length === 0) {
      await client.query(
        "INSERT INTO admin_users (id, user_id, role_id, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())",
        [userId, superAdminRoleId]
      );
      console.log("🔑 Registro de Administrador criado com papel 'Super Admin'!");
    } else {
      await client.query(
        "UPDATE admin_users SET role_id = $2, is_active = true, updated_at = NOW() WHERE user_id = $1",
        [userId, superAdminRoleId]
      );
      console.log("🔑 Registro de Administrador existente foi ativado e atualizado para 'Super Admin'!");
    }

    console.log(`\n🎉 PROMOÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`👉 O usuário '${email}' agora é Super Administrador.`);
    console.log(`👉 Acesse a aplicação, faça login com esta conta, e o Backoffice estará liberado.`);

  } catch (error) {
    console.error("❌ Erro durante o processo:", error);
  } finally {
    await client.end();
  }
}

run();
