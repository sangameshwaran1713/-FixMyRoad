import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const resetCitizenVerification = async () => {
  console.log('🔄 Resetting isEmailVerified = false for all Citizen accounts...');
  const isConnected = await connectDB();
  if (!isConnected) {
    process.exit(1);
  }

  const result = await User.updateMany(
    { role: 'CITIZEN' },
    { $set: { isEmailVerified: false, emailVerificationOTP: undefined, otpExpiresAt: undefined } }
  );

  console.log(`✅ Successfully updated ${result.modifiedCount} citizen account(s) to unverified state (isEmailVerified = false).`);
  process.exit(0);
};

resetCitizenVerification();
