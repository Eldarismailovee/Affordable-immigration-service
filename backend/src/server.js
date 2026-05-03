import app from "./app.js";
import env from "./config/env.js";
import { initializeDatabase } from "./db/init.js";
import { logger } from "./lib/logger.js";

const port = env.PORT || 5000;

await initializeDatabase();

app.listen(port, () => {
  logger.info({ port }, "Backend started");
});
