import { revokeUserRefreshTokens } from "../repositories/auth-token.repository.js";
import { anonymizeLeadsForUserId } from "../repositories/lead.repository.js";
import { anonymizeUserById } from "../repositories/user.repository.js";

export async function anonymizeUserRecord(userId) {
  await anonymizeLeadsForUserId(userId);
  const user = await anonymizeUserById(userId);
  await revokeUserRefreshTokens(userId);
  return user;
}
