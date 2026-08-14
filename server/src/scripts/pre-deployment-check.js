import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runPreDeploymentCheck = async () => {
  console.log('✈️ Launching Pre-Deployment Check Suite...');

  let checkPassed = true;

  // 1. Environment Config check
  const envPath = path.join(__dirname, '../../.env');
  const hasEnv = fs.existsSync(envPath);
  console.log(`  - Local .env File Existence: ${hasEnv ? '✅ PRESENT' : '❌ MISSING'}`);
  if (!hasEnv) checkPassed = false;

  // 2. Syntax Compile Verification on Server
  console.log('  - Running Express Server compilation check...');
  const serverJsPath = path.join(__dirname, '../../server.js');
  await new Promise((resolve) => {
    exec(`node -c "${serverJsPath}"`, (error) => {
      if (error) {
        console.error('    ❌ Express compilation error:', error.message);
        checkPassed = false;
      } else {
        console.log('    ✅ Server compilation: PASSED');
      }
      resolve();
    });
  });

  // 3. Database Connectivity check
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmyroad';
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('  - MongoDB Connection Check: ✅ CONNECTED');
    await mongoose.connection.close();
  } catch (err) {
    console.error('  - MongoDB Connection Check: ❌ FAILED', err.message);
    checkPassed = false;
  }

  // 4. Docker Production config check
  const dockerPath = path.join(__dirname, '../../../docker-compose.production.yml');
  const hasDocker = fs.existsSync(dockerPath);
  console.log(`  - Production Docker Orchestration Config: ${hasDocker ? '✅ PRESENT' : '⚠️ NOT FOUND IN ROOT'}`);

  console.log('\n----------------------------------------');
  if (checkPassed) {
    console.log('🎉 PRE-DEPLOYMENT CHECKS: PASSED (System is ready for release)');
    process.exit(0);
  } else {
    console.error('❌ PRE-DEPLOYMENT CHECKS: FAILED (Resolve configuration / syntax issues)');
    process.exit(1);
  }
};

runPreDeploymentCheck();
