import app from "./app.js";
import env from "./config/env.js";
import { initializeDatabase } from "./db/init.js";

const port = env.PORT || 5000;

await initializeDatabase();

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
