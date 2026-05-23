const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleOAuthClient = googleClientId ? new OAuth2Client(googleClientId) : null;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buildDisplayName(profile) {
  const email = normalizeEmail(profile.email);
  return String(profile.name || profile.given_name || email.split('@')[0] || 'Google User').trim();
}

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: String(user._id),
    id: user.numericId,
    numericId: user.numericId,
    name: user.name,
    email: user.email || '',
    googleId: user.googleId || '',
    avatarUrl: user.avatarUrl || '',
    isAdmin: Boolean(user.isAdmin),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function randomNumericId() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

async function generateUniqueNumericId(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const numericId = randomNumericId();
    const existing = await User.exists({ numericId });
    if (!existing) {
      return numericId;
    }
  }

  throw new Error('Unable to generate a unique 10-digit ID.');
}

async function createUserWithUniqueId(payload) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const numericId = await generateUniqueNumericId();

    try {
      const user = await User.create({
        name: payload.name,
        email: payload.email || undefined,
        googleId: payload.googleId || undefined,
        avatarUrl: payload.avatarUrl || '',
        numericId,
        isAdmin: Boolean(payload.isAdmin),
      });

      return user;
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.numericId) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to create a user with a unique 10-digit ID.');
}

async function createLocalUser(name) {
  const user = await createUserWithUniqueId({
    name: String(name).trim(),
    isAdmin: false,
  });

  return {
    user: serializeUser(user),
    created: true,
  };
}

async function findUserByNumericId(numericId) {
  return User.findOne({ numericId: String(numericId).trim() });
}

async function loginByNumericId(numericId) {
  const user = await findUserByNumericId(numericId);
  return serializeUser(user);
}

async function loginWithGoogleCredential(credential) {
  if (!googleOAuthClient) {
    const error = new Error('GOOGLE_CLIENT_ID is not configured.');
    error.statusCode = 500;
    throw error;
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: String(credential),
    audience: googleClientId,
  });

  const profile = ticket.getPayload();
  if (!profile?.sub) {
    const error = new Error('Invalid Google credential.');
    error.statusCode = 401;
    throw error;
  }

  const googleId = String(profile.sub).trim();
  const email = normalizeEmail(profile.email);
  const name = buildDisplayName(profile);
  const avatarUrl = String(profile.picture || '').trim();

  const existing = await User.findOne({
    $or: [{ googleId }, ...(email ? [{ email }] : [])],
  });

  if (existing) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          name,
          email: email || existing.email,
          googleId,
          avatarUrl,
        },
      },
      { new: true },
    );

    return {
      user: serializeUser(updatedUser),
      created: false,
    };
  }

  const user = await createUserWithUniqueId({
    name,
    email: email || undefined,
    googleId,
    avatarUrl,
    isAdmin: false,
  });

  return {
    user: serializeUser(user),
    created: true,
  };
}

module.exports = {
  createLocalUser,
  findUserByNumericId,
  loginByNumericId,
  loginWithGoogleCredential,
  serializeUser,
};