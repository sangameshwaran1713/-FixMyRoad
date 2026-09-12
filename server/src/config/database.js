import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB ERROR: MONGO_URI environment variable is missing.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MONGODB CONNECTION ERROR:');
    console.error(`Failed to connect to MongoDB at ${mongoURI}`);
    console.error(`Reason: ${error.message}`);

    try {
      console.log('🔄 Attempting fallback to in-memory MongoDB (mongodb-memory-server)...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`✅ In-Memory MongoDB Connected Successfully: ${uri}`);
      return true;
    } catch (fallbackErr) {
      console.error('⚠️ MongoMemoryServer fallback unavailable:', fallbackErr.message);
      console.error('⚠️ Please ensure MongoDB is running locally on port 27017 or set MONGO_URI in server/.env');
      return false;
    }
  }
};

export default connectDB;
