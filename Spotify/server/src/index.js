require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { OAuth2Client } = require('google-auth-library');
const {
  createUser,
  getUserById,
  addFriend,
  createFriendRequest,
  acceptFriendRequest,
  upsertGoogleUser,
  areFriends,
  listFriends,
} = require('./db');

const app = express();
const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const port = Number(process.env.PORT || 4000);
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleOAuthClient = googleClientId ? new OAuth2Client(googleClientId) : null;

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
  },
});

const onlineUsers = new Map();
const activeSessions = new Map();

function emitFriendListUpdate(userId) {
  const socketId = onlineUsers.get(userId);
  if (!socketId) {
    return;
  }

  io.to(socketId).emit('friends:list-updated', {
    userId,
    friends: listFriends(userId),
  });
}

function getSafeSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return null;
  }

  return {
    sessionId,
    users: session.users,
    state: session.state,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'UsTunes API' });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' });
  }

  if (!googleOAuthClient) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured.' });
  }

  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: String(credential),
      audience: googleClientId,
    });

    const profile = ticket.getPayload();
    if (!profile?.sub) {
      return res.status(401).json({ error: 'Invalid Google credential.' });
    }

    const { user, created } = upsertGoogleUser(profile);
    return res.json({ user, created });
  } catch (_error) {
    return res.status(401).json({ error: 'Google sign-in failed.' });
  }
});

app.post('/api/users/login', (req, res) => {
  const { name, userId } = req.body || {};

  if (userId) {
    const user = getUserById(String(userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found for that ID.' });
    }
    return res.json({ user });
  }

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }

  const user = createUser(String(name));
  return res.status(201).json({ user });
});

app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  const user = getUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ friends: listFriends(userId) });
});

app.post('/api/friends/add', (req, res) => {
  const { userId, friendId } = req.body || {};

  if (!userId || !friendId) {
    return res.status(400).json({ error: 'userId and friendId are required.' });
  }

  const normalizedUserId = String(userId).trim();
  const normalizedFriendId = String(friendId).trim();

  if (!/^\d{10}$/.test(normalizedUserId) || !/^\d{10}$/.test(normalizedFriendId)) {
    return res.status(400).json({ error: 'IDs must be exactly 10 digits.' });
  }

  if (normalizedUserId === normalizedFriendId) {
    return res.status(400).json({ error: 'You cannot add yourself.' });
  }

  const user = getUserById(normalizedUserId);
  const friend = getUserById(normalizedFriendId);

  if (!user || !friend) {
    return res.status(404).json({ error: 'User not found.' });
  }

  addFriend(normalizedUserId, normalizedFriendId);
  emitFriendListUpdate(normalizedUserId);
  emitFriendListUpdate(normalizedFriendId);
  return res.json({ success: true, friend });
});

app.post('/api/friends/request', (req, res) => {
  const { fromUserId, toUserId } = req.body || {};

  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'fromUserId and toUserId are required.' });
  }

  const senderId = String(fromUserId).trim();
  const receiverId = String(toUserId).trim();

  if (!/^\d{10}$/.test(senderId) || !/^\d{10}$/.test(receiverId)) {
    return res.status(400).json({ error: 'IDs must be exactly 10 digits.' });
  }

  if (senderId === receiverId) {
    return res.status(400).json({ error: 'You cannot send a request to yourself.' });
  }

  const sender = getUserById(senderId);
  const receiver = getUserById(receiverId);

  if (!sender || !receiver) {
    return res.status(404).json({ error: 'User not found.' });
  }

  createFriendRequest(senderId, receiverId);

  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('friends:request-received', {
      fromUserId: senderId,
      fromName: sender.name,
    });
  }

  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    io.to(senderSocketId).emit('friends:request-sent', {
      toUserId: receiverId,
    });
  }

  return res.json({ success: true });
});

function acceptFriendRequestHandler(req, res) {
  const { userId, requesterId } = req.body || {};

  if (!userId || !requesterId) {
    return res.status(400).json({ error: 'userId and requesterId are required.' });
  }

  const acceptingUserId = String(userId).trim();
  const requestingUserId = String(requesterId).trim();

  if (!/^\d{10}$/.test(acceptingUserId) || !/^\d{10}$/.test(requestingUserId)) {
    return res.status(400).json({ error: 'IDs must be exactly 10 digits.' });
  }

  if (acceptingUserId === requestingUserId) {
    return res.status(400).json({ error: 'Invalid friend request.' });
  }

  const acceptingUser = getUserById(acceptingUserId);
  const requestingUser = getUserById(requestingUserId);

  if (!acceptingUser || !requestingUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  try {
    acceptFriendRequest(requestingUserId, acceptingUserId);
  } catch (error) {
    if (error.code === 'REQUEST_NOT_FOUND') {
      return res.status(404).json({ error: 'Friend request not found.' });
    }
    throw error;
  }

  emitFriendListUpdate(acceptingUserId);
  emitFriendListUpdate(requestingUserId);

  const requesterSocketId = onlineUsers.get(requestingUserId);
  if (requesterSocketId) {
    io.to(requesterSocketId).emit('friends:request-accepted', {
      byUserId: acceptingUserId,
      byName: acceptingUser.name,
    });
  }

  const accepterSocketId = onlineUsers.get(acceptingUserId);
  if (accepterSocketId) {
    io.to(accepterSocketId).emit('friends:request-accepted', {
      byUserId: acceptingUserId,
      friendId: requestingUserId,
      friendName: requestingUser.name,
    });
  }

  return res.json({ success: true, friend: requestingUser });
}

app.post('/api/friends/accept', acceptFriendRequestHandler);

app.post('/api/friends/requests/accept', (req, res) => {
  return acceptFriendRequestHandler(req, res);
});

io.on('connection', (socket) => {
  const userId = String(socket.handshake.query.userId || '');
  if (!/^\d{10}$/.test(userId)) {
    socket.emit('error:message', { error: 'Invalid user ID.' });
    socket.disconnect(true);
    return;
  }

  onlineUsers.set(userId, socket.id);
  socket.data.userId = userId;

  socket.on('friends:invite', ({ toUserId }) => {
    const fromUserId = socket.data.userId;
    const targetUserId = String(toUserId || '');

    if (!/^\d{10}$/.test(targetUserId)) {
      socket.emit('error:message', { error: 'Invalid friend ID.' });
      return;
    }

    if (!areFriends(fromUserId, targetUserId)) {
      socket.emit('error:message', { error: 'You can only invite existing friends.' });
      return;
    }

    const targetSocketId = onlineUsers.get(targetUserId);
    if (!targetSocketId) {
      socket.emit('error:message', { error: 'Friend is offline.' });
      return;
    }

    const fromUser = getUserById(fromUserId);
    io.to(targetSocketId).emit('friends:invite-received', {
      fromUserId,
      fromName: fromUser?.name || 'Friend',
    });
    socket.emit('friends:invite-sent', { toUserId: targetUserId });
  });

  socket.on('session:accept', ({ fromUserId }) => {
    const toUserId = socket.data.userId;
    const inviterUserId = String(fromUserId || '');

    if (!/^\d{10}$/.test(inviterUserId)) {
      socket.emit('error:message', { error: 'Invalid inviter ID.' });
      return;
    }

    if (!areFriends(toUserId, inviterUserId)) {
      socket.emit('error:message', { error: 'Users must be friends to listen together.' });
      return;
    }

    const inviterSocketId = onlineUsers.get(inviterUserId);
    if (!inviterSocketId) {
      socket.emit('error:message', { error: 'Inviter is no longer online.' });
      return;
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const room = sessionId;

    const session = {
      users: [inviterUserId, toUserId],
      state: {
        trackIndex: 0,
        currentTime: 0,
        isPlaying: false,
        updatedAt: Date.now(),
      },
    };

    activeSessions.set(sessionId, session);

    socket.join(room);
    const inviterSocket = io.sockets.sockets.get(inviterSocketId);
    inviterSocket?.join(room);

    const safeSession = getSafeSession(sessionId);
    io.to(room).emit('session:started', safeSession);
  });

  socket.on('friends:refresh', () => {
    socket.emit('friends:list-updated', {
      userId: socket.data.userId,
      friends: listFriends(socket.data.userId),
    });
  });

  socket.on('session:update', ({ sessionId, patch }) => {
    const id = String(sessionId || '');
    const session = activeSessions.get(id);

    if (!session) {
      socket.emit('error:message', { error: 'Session not found.' });
      return;
    }

    const userIdInSocket = socket.data.userId;
    if (!session.users.includes(userIdInSocket)) {
      socket.emit('error:message', { error: 'Not allowed in this session.' });
      return;
    }

    session.state = {
      ...session.state,
      ...patch,
      updatedAt: Date.now(),
    };

    socket.to(id).emit('session:remote-update', {
      sessionId: id,
      patch: session.state,
    });
  });

  socket.on('session:leave', ({ sessionId }) => {
    const id = String(sessionId || '');
    const session = activeSessions.get(id);
    if (!session) {
      return;
    }

    const userIdInSocket = socket.data.userId;
    if (!session.users.includes(userIdInSocket)) {
      return;
    }

    activeSessions.delete(id);
    io.to(id).emit('session:ended', { reason: 'A listener left the session.' });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.data.userId);

    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.users.includes(socket.data.userId)) {
        activeSessions.delete(sessionId);
        io.to(sessionId).emit('session:ended', {
          reason: 'A listener disconnected.',
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`UsTunes API listening on http://localhost:${port}`);
});
