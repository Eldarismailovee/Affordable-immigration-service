import { randomUUID } from "crypto";

export function buildIntakeDraftRepo(store) {
  if (!store.intakeDrafts) {
    store.intakeDrafts = new Map();
  }

  return {
    findIntakeDraftByUserId: async (userId) => {
      for (const draft of store.intakeDrafts.values()) {
        if (draft.userId === userId && !draft.submittedAt) {
          return draft;
        }
      }
      return null;
    },
    upsertIntakeDraft: async ({ userId, data, expectedVersion = null }) => {
      const existing = await buildIntakeDraftRepo(store).findIntakeDraftByUserId(userId);

      if (existing && expectedVersion !== null && existing.version !== expectedVersion) {
        return { conflict: true, draft: existing };
      }

      if (existing) {
        existing.data = data;
        existing.version += 1;
        existing.updatedAt = new Date().toISOString();
        existing.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        return { conflict: false, draft: existing };
      }

      const draft = {
        id: randomUUID(),
        userId,
        schemaVersion: 1,
        version: 1,
        data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: null,
      };

      store.intakeDrafts.set(draft.id, draft);
      return { conflict: false, draft };
    },
    deleteIntakeDraftForUser: async (userId) => {
      for (const [id, draft] of store.intakeDrafts.entries()) {
        if (draft.userId === userId) {
          store.intakeDrafts.delete(id);
        }
      }
    },
    markIntakeDraftSubmitted: async (userId) => {
      for (const draft of store.intakeDrafts.values()) {
        if (draft.userId === userId) {
          draft.submittedAt = new Date().toISOString();
        }
      }
    },
    deleteExpiredIntakeDrafts: async () => 0,
    deleteIntakeDraftsForUser: async (userId) => {
      await buildIntakeDraftRepo(store).deleteIntakeDraftForUser(userId);
    },
  };
}
