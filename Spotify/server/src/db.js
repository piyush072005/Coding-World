const Database = require('better-sqlite3');

const db = new Database('ustunes.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    google_sub TEXT,
    auth_provider TEXT NOT NULL DEFAULT 'local',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friends (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const friendColumns = db.prepare('PRAGMA table_info(friends)').all();
if (!friendColumns.some((column) => column.name === 'status')) {
  db.exec("ALTER TABLE friends ADD COLUMN status TEXT NOT NULL DEFAULT 'accepted'");
}

const userColumns = db.prepare('PRAGMA table_info(users)').all();
if (!userColumns.some((column) => column.name === 'email')) {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT');
}
if (!userColumns.some((column) => column.name === 'avatar_url')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
}
if (!userColumns.some((column) => column.name === 'google_sub')) {
  db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
}
if (!userColumns.some((column) => column.name === 'auth_provider')) {
  db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'");
}

db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)');

function generateUniqueId() {
  const findUserById = db.prepare('SELECT id FROM users WHERE id = ?');

  while (true) {
    const id = String(Math.floor(1000000000 + Math.random() * 9000000000));
    if (!findUserById.get(id)) {
      return id;
    }
  }
}

const createUserStmt = db.prepare('INSERT INTO users (id, name) VALUES (?, ?)');
const findUserByIdStmt = db.prepare('SELECT id, name, email, avatar_url, google_sub, auth_provider, created_at FROM users WHERE id = ?');
const findUserByGoogleSubStmt = db.prepare(
  'SELECT id, name, email, avatar_url, google_sub, auth_provider, created_at FROM users WHERE google_sub = ? LIMIT 1',
);
const findUserByEmailStmt = db.prepare(
  'SELECT id, name, email, avatar_url, google_sub, auth_provider, created_at FROM users WHERE email = ? LIMIT 1',
);
const createGoogleUserStmt = db.prepare(
  'INSERT INTO users (id, name, email, avatar_url, google_sub, auth_provider) VALUES (?, ?, ?, ?, ?, ?)',
);
const updateGoogleUserStmt = db.prepare(
  'UPDATE users SET name = ?, email = ?, avatar_url = ?, google_sub = ?, auth_provider = ? WHERE id = ?',
);
const addFriendStmt = db.prepare(
  "INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')",
);
const createFriendRequestStmt = db.prepare(
  "INSERT OR IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",
);
const listFriendsStmt = db.prepare(`
  SELECT DISTINCT u.id, u.name
  FROM friends f
  JOIN users u
    ON (
      (f.user_id = ? AND u.id = f.friend_id)
      OR
      (f.friend_id = ? AND u.id = f.user_id)
    )
  WHERE f.status = 'accepted'
  ORDER BY u.name ASC
`);
const friendshipStmt = db.prepare(
  `
    SELECT 1
    FROM friends
    WHERE status = 'accepted'
      AND (
        (user_id = ? AND friend_id = ?)
        OR
        (user_id = ? AND friend_id = ?)
      )
    LIMIT 1
  `,
);
const findFriendEdgeStmt = db.prepare(
  'SELECT user_id, friend_id, status FROM friends WHERE user_id = ? AND friend_id = ? LIMIT 1',
);
const setFriendStatusStmt = db.prepare(
  'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
);
const insertFriendEdgeStmt = db.prepare(
  'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
);

function createUser(name) {
  const id = generateUniqueId();
  createUserStmt.run(id, name.trim());
  return findUserByIdStmt.get(id);
}

function getUserById(id) {
  return findUserByIdStmt.get(id);
}

function getUserByGoogleProfile(profile) {
  const googleSub = String(profile.sub || '').trim();
  const email = String(profile.email || '').trim().toLowerCase();

  if (!googleSub) {
    return null;
  }

  const byGoogleSub = findUserByGoogleSubStmt.get(googleSub);
  if (byGoogleSub) {
    return byGoogleSub;
  }

  if (email) {
    return findUserByEmailStmt.get(email) || null;
  }

  return null;
}

function upsertGoogleUser(profile) {
  const googleSub = String(profile.sub || '').trim();
  const email = String(profile.email || '').trim().toLowerCase();
  const name = String(profile.name || profile.given_name || email.split('@')[0] || 'Google User').trim();
  const avatarUrl = String(profile.picture || '').trim();

  if (!googleSub) {
    const error = new Error('Google profile is missing a subject identifier.');
    error.code = 'INVALID_GOOGLE_PROFILE';
    throw error;
  }

  const tx = db.transaction(() => {
    const existing = getUserByGoogleProfile(profile);

    if (existing) {
      updateGoogleUserStmt.run(
        name,
        email || null,
        avatarUrl || null,
        googleSub,
        'google',
        existing.id,
      );
      return {
        user: findUserByIdStmt.get(existing.id),
        created: false,
      };
    }

    const id = generateUniqueId();
    createGoogleUserStmt.run(id, name, email || null, avatarUrl || null, googleSub, 'google');
    return {
      user: findUserByIdStmt.get(id),
      created: true,
    };
  });

  return tx();
}

function addFriend(userId, friendId) {
  const tx = db.transaction(() => {
    addFriendStmt.run(userId, friendId);
    addFriendStmt.run(friendId, userId);
  });
  tx();
}

function createFriendRequest(fromUserId, toUserId) {
  createFriendRequestStmt.run(fromUserId, toUserId);
}

function acceptFriendRequest(fromUserId, toUserId) {
  const tx = db.transaction(() => {
    const incoming = findFriendEdgeStmt.get(fromUserId, toUserId);

    if (!incoming) {
      const error = new Error('Friend request not found.');
      error.code = 'REQUEST_NOT_FOUND';
      throw error;
    }

    if (incoming.status !== 'accepted') {
      setFriendStatusStmt.run('accepted', fromUserId, toUserId);
    }

    const reciprocal = findFriendEdgeStmt.get(toUserId, fromUserId);

    if (!reciprocal) {
      try {
        insertFriendEdgeStmt.run(toUserId, fromUserId, 'accepted');
      } catch (error) {
        if (error.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          throw error;
        }
      }
    } else if (reciprocal.status !== 'accepted') {
      setFriendStatusStmt.run('accepted', toUserId, fromUserId);
    }
  });

  tx();
}

function areFriends(userId, friendId) {
  return Boolean(friendshipStmt.get(userId, friendId, friendId, userId));
}

function listFriends(userId) {
  return listFriendsStmt.all(userId, userId);
}

module.exports = {
  createUser,
  getUserById,
  upsertGoogleUser,
  addFriend,
  createFriendRequest,
  acceptFriendRequest,
  areFriends,
  listFriends,
};
