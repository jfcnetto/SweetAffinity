import { db } from "./db/index.js";
import { blogPosts } from "./db/schema.js";

async function main() {
  console.log("Starting deletion of all blog posts...");
  await db.delete(blogPosts);
  console.log("All blog posts cleared successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error clearing blog posts:", err);
  process.exit(1);
});
