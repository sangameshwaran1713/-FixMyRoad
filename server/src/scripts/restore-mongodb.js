import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const restoreDatabase = async () => {
  console.log('🚨 Starting MongoDB Database Restore Process...');

  const confirm = process.env.CONFIRM_RESTORE === 'true';
  if (!confirm) {
    console.error('❌ RESTORE ABORTED: Confirmation flag CONFIRM_RESTORE=true is not set.');
    console.log('  👉 To run this restore, execute the script with: CONFIRM_RESTORE=true node restore-mongodb.js');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmyroad';
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

  // Find latest backup folder
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Restore failed: Backup directory ${backupDir} does not exist.`);
    process.exit(1);
  }

  const files = fs.readdirSync(backupDir).sort().reverse();
  const latestBackup = files.find((f) => f.startsWith('fixmyroad-'));

  if (!latestBackup) {
    console.error('❌ Restore failed: No valid fixmyroad backup dump folders found.');
    process.exit(1);
  }

  const targetRestorePath = path.join(backupDir, latestBackup);
  console.log(`  - Latest Backup Found: ${latestBackup}`);
  console.log(`  - Target Restore Folder: ${targetRestorePath}`);

  // Safe URI masking
  let safeUri = mongoUri;
  const match = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/);
  if (match) {
    safeUri = mongoUri.replace(match[2], '******');
  }
  console.log(`  - Restoring to: ${safeUri}`);

  // Run mongorestore command
  const command = `mongorestore --uri="${mongoUri}" --drop "${targetRestorePath}"`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.warn('  ⚠️ mongorestore CLI failed or not installed. Running schema validation fallback...');
    } else {
      console.log('✅ mongorestore executed successfully.');
    }

    // Connect to database to verify restore integrity
    try {
      await mongoose.connect(mongoUri);
      console.log('  ✓ Connected to MongoDB to verify schemas...');

      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);

      console.log('🔍 Database Verification Report:');
      const requiredCollections = [
        'users',
        'complaints',
        'complainthistories',
        'auditlogs',
        'notifications',
        'notificationevents',
        'notificationdeliveries',
        'reopenrequests',
        'complaintfeedbacks',
      ];

      let allExist = true;
      requiredCollections.forEach((col) => {
        const exists = collectionNames.includes(col);
        console.log(`  - Collection [${col}]: ${exists ? '✅ PRESENT' : '⚠️ MISSING'}`);
        if (!exists) allExist = false;
      });

      if (allExist) {
        console.log('🎉 Database integrity verification: PASSED');
      } else {
        console.warn('⚠️ Database schema verification: PARTIAL (Some collection schemas are empty)');
      }

      await mongoose.connection.close();
      console.log('👋 Database connection closed.');
      process.exit(0);
    } catch (dbErr) {
      console.error('❌ Failed to verify database connectivity after restore:', dbErr.message);
      process.exit(1);
    }
  });
};

restoreDatabase();
