import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  
  console.log("=== Tabelas no banco ===");
  res.rows.forEach(row => console.log("  -", row.table_name));
  console.log(`\nTotal: ${res.rows.length} tabelas`);

  // Verificar se as tabelas CRM existem
  const crmTables = [
    "admin_roles", "admin_users", "ai_budget_config", "ai_usage_logs",
    "broadcast_campaigns", "financial_events", "site_settings",
    "user_crm_notes", "user_special_access"
  ];
  
  console.log("\n=== Verificação CRM ===");
  const missing = [];
  for (const t of crmTables) {
    const found = res.rows.some(r => r.table_name === t);
    console.log(`  ${found ? "✓" : "✗"} ${t}`);
    if (!found) missing.push(t);
  }
  
  if (missing.length === 0) {
    console.log("\n✅ TODAS as tabelas CRM foram criadas com sucesso!");
  } else {
    console.log(`\n❌ Faltam ${missing.length} tabelas: ${missing.join(", ")}`);
  }
  
  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
