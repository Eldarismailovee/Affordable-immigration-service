import app from "./app.js";
import env from "./config/env.js";
import { seedInitialAdmin } from "./db/init.js";
import { runMigrations } from "./db/migrate.js";
import { logger } from "./lib/logger.js";

const port = env.PORT || 5000;

await runMigrations();
await seedInitialAdmin();

app.listen(port, () => {
  logger.info({ port }, "Backend started");
});
