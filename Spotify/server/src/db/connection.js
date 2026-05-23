const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

async function connectMongo() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  return mongoose;
}

module.exports = { connectMongo };