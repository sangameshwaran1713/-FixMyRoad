import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB ERROR: MONGO_URI environment variable is missing.');
    console.error('Please configure MONGO_URI in your server/.env file.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout for selection
    });

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MONGODB CONNECTION ERROR:');
    console.error(`Failed to connect to MongoDB at ${mongoURI}`);
    console.error(`Reason: ${error.message}`);
    console.error('⚠️ Server will continue running, but database operations will fail until MongoDB is available.');
    return false;
  }
};

export default connectDB;
