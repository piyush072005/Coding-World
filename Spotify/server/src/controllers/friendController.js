const mongoose = require('mongoose');
const Friendship = require('../models/Friendship');
const { findUserByNumericId } = require('./authController');

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function resolveUsersByNumericIds(userId, friendId) {
  const [user, friend] = await Promise.all([
    findUserByNumericId(userId),
    findUserByNumericId(friendId),
  ]);

  if (!user || !friend) {
    throw createHttpError('User not found.', 404);
  }

  if (String(user.numericId) === String(friend.numericId)) {
    throw createHttpError('You cannot add yourself.', 400);
  }

  return { user, friend };
}

async function areFriends(userId, friendId) {
  const { user, friend } = await resolveUsersByNumericIds(userId, friendId);

  const existing = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requester: user._id, recipient: friend._id },
      { requester: friend._id, recipient: user._id },
    ],
  }).select('_id');

  return Boolean(existing);
}

async function createFriendRequest(fromUserId, toUserId) {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const { user: requester, friend: recipient } = await resolveUsersByNumericIds(fromUserId, toUserId);

      const alreadyFriends = await Friendship.findOne({
        status: 'accepted',
        $or: [
          { requester: requester._id, recipient: recipient._id },
          { requester: recipient._id, recipient: requester._id },
        ],
      }).session(session);

      if (alreadyFriends) {
        result = { created: false, alreadyFriends: true };
        return;
      }

      const pending = await Friendship.findOneAndUpdate(
        { requester: requester._id, recipient: recipient._id },
        {
          $set: { status: 'pending' },
          $setOnInsert: {
            requester: requester._id,
            recipient: recipient._id,
            status: 'pending',
          },
        },
        { upsert: true, new: true, session },
      );

      result = { created: true, friendship: pending };
    });

    return result;
  } finally {
    session.endSession();
  }
}

async function addMutualAcceptedFriendship(userId, friendId) {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const { user, friend } = await resolveUsersByNumericIds(userId, friendId);

      const forward = await Friendship.findOneAndUpdate(
        { requester: user._id, recipient: friend._id },
        {
          $set: { status: 'accepted' },
          $setOnInsert: {
            requester: user._id,
            recipient: friend._id,
            status: 'accepted',
          },
        },
        { upsert: true, new: true, session },
      );

      try {
        await Friendship.findOneAndUpdate(
          { requester: friend._id, recipient: user._id },
          {
            $set: { status: 'accepted' },
            $setOnInsert: {
              requester: friend._id,
              recipient: user._id,
              status: 'accepted',
            },
          },
          { upsert: true, new: true, session },
        );
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }

      result = { requester: user, recipient: friend, friendship: forward };
    });

    return result;
  } finally {
    session.endSession();
  }
}

async function acceptFriendRequest(requesterId, recipientId) {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const { user: requester, friend: recipient } = await resolveUsersByNumericIds(requesterId, recipientId);

      const pendingRequest = await Friendship.findOne({
        requester: requester._id,
        recipient: recipient._id,
      }).session(session);

      if (!pendingRequest) {
        throw createHttpError('Friend request not found.', 404);
      }

      const updatedRequest = await Friendship.findOneAndUpdate(
        { _id: pendingRequest._id },
        { $set: { status: 'accepted' } },
        { new: true, session },
      );

      try {
        await Friendship.findOneAndUpdate(
          { requester: recipient._id, recipient: requester._id },
          {
            $set: { status: 'accepted' },
            $setOnInsert: {
              requester: recipient._id,
              recipient: requester._id,
              status: 'accepted',
            },
          },
          { upsert: true, new: true, session },
        );
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }

      result = {
        requester,
        recipient,
        friendship: updatedRequest,
      };
    });

    return result;
  } finally {
    session.endSession();
  }
}

async function listFriends(userId) {
  const user = await findUserByNumericId(userId);
  if (!user) {
    throw createHttpError('User not found.', 404);
  }

  const friendships = await Friendship.find({
    requester: user._id,
    status: 'accepted',
  })
    .populate('recipient', 'name email googleId numericId avatarUrl isAdmin')
    .sort({ createdAt: -1 })
    .lean();

  return friendships
    .map((friendship) => friendship.recipient)
    .filter(Boolean)
    .map((friend) => ({
      _id: String(friend._id),
      id: friend.numericId,
      numericId: friend.numericId,
      name: friend.name,
      email: friend.email || '',
      googleId: friend.googleId || '',
      avatarUrl: friend.avatarUrl || '',
      isAdmin: Boolean(friend.isAdmin),
    }));
}

module.exports = {
  areFriends,
  addMutualAcceptedFriendship,
  acceptFriendRequest,
  createFriendRequest,
  listFriends,
};