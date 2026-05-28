import app from "./app.js";
import { registerGracefulShutdown } from "./bootstrap/gracefulShutdown.js";
import { seedInitialAdmin } from "./bootstrap/seedInitialAdmin.js";
import env from "./config/env.js";
import { logger } from "./lib/logger.js";

const port = env.PORT || 5000;

await seedInitialAdmin();

const server = app.listen(port, () => {
  logger.info({ port }, "Backend started");
});

registerGracefulShutdown(server);
