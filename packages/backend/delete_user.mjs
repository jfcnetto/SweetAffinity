import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://sweet_admin:secure_password_2026@localhost:5432/sweetaffinity',
});

async function run() {
  try {
    const res = await pool.query("DELETE FROM users WHERE email = 'jfcnetto73@gmail.com'");
    console.log('✅ Usuário deletado com sucesso! Linhas removidas:', res.rowCount);
  } catch (err) {
    console.error('Erro ao deletar:', err);
  } finally {
    pool.end();
  }
}

run();
