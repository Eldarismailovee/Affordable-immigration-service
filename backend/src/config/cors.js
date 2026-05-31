import env from "./env.js";

export const corsConfig = Object.freeze({
  origin: env.CORS_ORIGINS,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

export default corsConfig;
