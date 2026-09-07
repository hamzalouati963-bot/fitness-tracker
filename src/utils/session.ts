/**
 * SessionManager — manages the active user session.
 * Stores active_user_id in SQLite app_session table (persists across app restarts).
 * Also holds the in-memory current user ID for fast access by repositories.
 */
import { getDatabase } from '../database';

let currentUserId: number | null = null;

export const sessionManager = {
  getCurrentUserId(): number {
    if (currentUserId === null) throw new Error('No active session');
    return currentUserId;
  },

  tryGetCurrentUserId(): number | null {
    return currentUserId;
  },

  hasActiveSession(): boolean {
    return currentUserId !== null;
  },

  async restoreSession(): Promise<number | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ active_user_id: number | null }>(
      'SELECT active_user_id FROM app_session WHERE id = 1'
    );
    if (row?.active_user_id) {
      currentUserId = row.active_user_id;
      return row.active_user_id;
    }
    return null;
  },

  async persistSession(userId: number): Promise<void> {
    const db = await getDatabase();
    currentUserId = userId;
    await db.runAsync(
      'INSERT OR REPLACE INTO app_session (id, active_user_id) VALUES (1, ?)',
      [userId]
    );
  },

  async clearSession(): Promise<void> {
    const db = await getDatabase();
    currentUserId = null;
    await db.runAsync('UPDATE app_session SET active_user_id = NULL WHERE id = 1', []);
  },
};
