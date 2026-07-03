import pg from "pg";
import "dotenv/config";

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();
  try {
    await client.query('DROP TABLE IF EXISTS "likes" CASCADE');
    console.log("Dropped likes table");
    
    await client.query('DROP TYPE IF EXISTS "user_role" CASCADE');
    console.log("Dropped user_role enum");

    // Drop other old tables if they exist to be safe against rename prompts
    await client.query('DROP TABLE IF EXISTS "matches" CASCADE');
    console.log("Dropped matches table");
    
    await client.query('DROP TABLE IF EXISTS "subscriptions" CASCADE');
    console.log("Dropped subscriptions table");
    
    await client.query('ALTER TABLE "profiles" DROP COLUMN IF EXISTS "profile_type" CASCADE');
    console.log("Dropped profile_type column");
    
    // Actually we only need to drop tables that Drizzle thinks are renamed to NEW tables!
    // Since we only added CRM tables, "likes" -> "admin_roles" was one guess.
    // Drizzle might guess others if they have similar columns.

    console.log("Cleanup complete!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
