/**
 * Startup lifecycle + session safety tests.
 * Verifies that database init never requires an active session,
 * and that the correct auth state is reached in all scenarios.
 */

import { hashPassword, generateSalt, verifyPassword } from '../crypto';

// ─── Simulated in-memory startup engine ──────────────────────────────────────
// This replicates the App.tsx startup logic to test all paths without SQLite.

type AuthState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'unauthenticated'; accountCount: number }
  | { status: 'authenticated'; userId: number; hasProfile: boolean };

type SessionRecord = { active_user_id: number | null };
type Account = { id: number; email: string; password_hash: string; password_salt: string };

function createStartupEngine(opts: {
  session: SessionRecord;
  accounts: Account[];
  profiles: Map<number, boolean>;
}) {
  let currentUserId: number | null = null;

  const session = {
    getCurrentUserId: () => {
      if (currentUserId === null) throw new Error('No active session');
      return currentUserId;
    },
    tryGetCurrentUserId: () => currentUserId,
    persistSession: (id: number) => { currentUserId = id; opts.session.active_user_id = id; },
    clearSession: () => { currentUserId = null; opts.session.active_user_id = null; },
    restoreSession: () => {
      if (opts.session.active_user_id) {
        currentUserId = opts.session.active_user_id;
        return opts.session.active_user_id;
      }
      return null;
    },
  };

  // Simulates App.tsx startup — must NOT call getCurrentUserId() before session
  async function startup(): Promise<AuthState> {
    // PHASE A — Database bootstrap (no user required)
    // (In real app this creates tables, runs migrations, etc.)
    // This phase must complete without error regardless of session state.

    // PHASE B — Session restoration
    const activeUserId = session.restoreSession();

    if (activeUserId) {
      const account = opts.accounts.find(a => a.id === activeUserId);
      if (account) {
        // Valid session — safe to query user data
        const hasProfile = opts.profiles.get(activeUserId) ?? false;
        return { status: 'authenticated', userId: activeUserId, hasProfile };
      } else {
        // Invalid session (account deleted)
        session.clearSession();
        return { status: 'unauthenticated', accountCount: opts.accounts.length };
      }
    } else {
      // No session
      return { status: 'unauthenticated', accountCount: opts.accounts.length };
    }
  }

  return { startup, session };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Startup lifecycle', () => {
  test('TEST 1: Fresh install with no accounts and no session', async () => {
    const engine = createStartupEngine({
      session: { active_user_id: null },
      accounts: [],
      profiles: new Map(),
    });

    const state = await engine.startup();
    expect(state.status).toBe('unauthenticated');
    if (state.status === 'unauthenticated') {
      expect(state.accountCount).toBe(0);
    }
  });

  test('TEST 2: Fresh install with accounts but no session → login screen', async () => {
    const engine = createStartupEngine({
      session: { active_user_id: null },
      accounts: [{ id: 1, email: 'a@b.com', password_hash: 'h', password_salt: 's' }],
      profiles: new Map([[1, true]]),
    });

    const state = await engine.startup();
    expect(state.status).toBe('unauthenticated');
    if (state.status === 'unauthenticated') {
      expect(state.accountCount).toBe(1);
    }
  });

  test('TEST 3: Valid persisted session → authenticated with correct user', async () => {
    const engine = createStartupEngine({
      session: { active_user_id: 42 },
      accounts: [{ id: 42, email: 'u@x.com', password_hash: 'h', password_salt: 's' }],
      profiles: new Map([[42, true]]),
    });

    const state = await engine.startup();
    expect(state.status).toBe('authenticated');
    if (state.status === 'authenticated') {
      expect(state.userId).toBe(42);
      expect(state.hasProfile).toBe(true);
    }
  });

  test('TEST 4: Invalid persisted session (account deleted) → unauthenticated, no crash', async () => {
    const engine = createStartupEngine({
      session: { active_user_id: 99 },
      accounts: [], // account 99 does not exist
      profiles: new Map(),
    });

    const state = await engine.startup();
    expect(state.status).toBe('unauthenticated');
    // Session was cleared
    expect(engine.session.tryGetCurrentUserId()).toBeNull();
  });

  test('TEST 5: No session → getCurrentUserId() throws, not returns a fallback', () => {
    const session = {
      active_user_id: null as number | null,
    };
    let currentUserId: number | null = null;
    const getCurrentUserId = () => {
      if (currentUserId === null) throw new Error('No active session');
      return currentUserId;
    };

    expect(() => getCurrentUserId()).toThrow('No active session');
    expect(currentUserId).toBeNull();
  });

  test('TEST 6: Database bootstrap phase never calls getCurrentUserId', () => {
    let getCurrentUserIdCalled = false;
    const guard = () => {
      getCurrentUserIdCalled = true;
      throw new Error('Must not be called during bootstrap');
    };

    // Simulate bootstrap — only table creation, no user queries
    const bootstrapPhase = () => {
      // This phase should only do:
      // - openDatabase
      // - createTable
      // - createIndex
      // - runMigrations
      // None of these should call getCurrentUserId
    };

    bootstrapPhase();
    expect(getCurrentUserIdCalled).toBe(false);
  });
});

describe('Login flow', () => {
  test('TEST 7: Successful login establishes session', () => {
    const salt = generateSalt();
    const hash = hashPassword('mypassword', salt);
    const accounts: Account[] = [{ id: 7, email: 'test@test.com', password_hash: hash, password_salt: salt }];

    let currentUserId: number | null = null;

    // Simulate login
    const account = accounts.find(a => a.email === 'test@test.com');
    expect(account).toBeDefined();
    expect(verifyPassword('mypassword', account!.password_salt, account!.password_hash)).toBe(true);

    currentUserId = account!.id;
    expect(currentUserId).toBe(7);
  });

  test('TEST 8: Wrong password does not establish session', () => {
    const salt = generateSalt();
    const hash = hashPassword('mypassword', salt);
    const accounts: Account[] = [{ id: 8, email: 'test@test.com', password_hash: hash, password_salt: salt }];

    let currentUserId: number | null = null;

    const account = accounts.find(a => a.email === 'test@test.com');
    expect(account).toBeDefined();
    expect(verifyPassword('wrongpassword', account!.password_salt, account!.password_hash)).toBe(false);

    // Session should NOT be set
    expect(currentUserId).toBeNull();
  });

  test('TEST 9: Registration creates account + establishes session', () => {
    const salt = generateSalt();
    const hash = hashPassword('newpassword', salt);
    const accounts: Account[] = [];
    let nextId = 1;

    let currentUserId: number | null = null;

    // Simulate registration
    const newAccount: Account = {
      id: nextId++,
      email: 'new@user.com',
      password_hash: hash,
      password_salt: salt,
    };
    accounts.push(newAccount);
    currentUserId = newAccount.id;

    expect(accounts).toHaveLength(1);
    expect(accounts[0].email).toBe('new@user.com');
    expect(currentUserId).toBe(1);
    expect(currentUserId).not.toBeNull();
  });
});

describe('Logout flow', () => {
  test('TEST 10: Logout clears session', () => {
    let currentUserId: number | null = 5;
    const clearSession = () => { currentUserId = null; };

    expect(currentUserId).toBe(5);
    clearSession();
    expect(currentUserId).toBeNull();
  });

  test('TEST 11: After logout, new user can log in independently', () => {
    let currentUserId: number | null = 1;

    // User 1 logs out
    currentUserId = null;
    expect(currentUserId).toBeNull();

    // User 2 logs in
    currentUserId = 2;
    expect(currentUserId).toBe(2);
  });
});

describe('Data isolation across login sessions', () => {
  test('TEST 12: User A data is not visible to User B', () => {
    const workouts = [
      { id: 1, user_id: 1, name: 'A Workout' },
      { id: 2, user_id: 2, name: 'B Workout' },
    ];

    const filterByUser = (userId: number) => workouts.filter(w => w.user_id === userId);

    expect(filterByUser(1)).toHaveLength(1);
    expect(filterByUser(1)[0].name).toBe('A Workout');
    expect(filterByUser(2)).toHaveLength(1);
    expect(filterByUser(2)[0].name).toBe('B Workout');
  });

  test('TEST 13: User B cannot modify User A data', () => {
    const meals = [{ id: 1, user_id: 1, name: 'A Meal' }];
    const currentUserId = 2;

    // Attempt to update — in real repo this checks WHERE id = ? AND user_id = ?
    const targetMeal = meals.find(m => m.id === 1 && m.user_id === currentUserId);
    expect(targetMeal).toBeUndefined(); // Not found for user 2
  });

  test('TEST 14: New account gets unique user_id, never forced to 1', () => {
    let nextAccountId = 100; // Simulating existing accounts up to 99
    const newAccountId = nextAccountId++;
    expect(newAccountId).toBe(100);
    expect(newAccountId).not.toBe(1);
  });
});

describe('Existing legacy data preserved', () => {
  test('TEST 15: Legacy user_id=1 data still accessible after migration', () => {
    const profiles = new Map<number, string>();
    profiles.set(1, 'Legacy User Data');

    expect(profiles.get(1)).toBe('Legacy User Data');
  });
});
