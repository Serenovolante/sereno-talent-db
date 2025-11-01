import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (global.mongoose!.conn) {
    return global.mongoose!.conn;
  }

  if (!global.mongoose!.promise) {
    const opts = {
      bufferCommands: false,
    };

    global.mongoose!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose.connection;
    });
  }

  try {
    global.mongoose!.conn = await global.mongoose!.promise;
  } catch (e) {
    global.mongoose!.promise = null;
    throw e;
  }

  return global.mongoose!.conn;
}

export default connectToDatabase;