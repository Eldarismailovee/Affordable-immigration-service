import env from "./env.js";

export const securityConfig = Object.freeze({
  authTokenSecret: env.AUTH_TOKEN_SECRET,
  isProduction: env.isProduction,
});

export default securityConfig;
