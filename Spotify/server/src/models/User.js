const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      sparse: true,
    },
    googleId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
      unique: true,
    },
    numericId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^\d{10}$/,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);