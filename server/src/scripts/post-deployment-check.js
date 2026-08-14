import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runPostDeploymentCheck = async () => {
  console.log('🏁 Launching Post-Deployment Operational Verification...');

  const serverPort = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${serverPort}/api`;
  let checkPassed = true;

  // 1. Verify Process Liveness Health Check
  try {
    const res = await axios.get(`${baseUrl}/health/live`);
    console.log(`  - Liveness Endpoint (/health/live): ✅ ONLINE (Status: ${res.data.status})`);
  } catch (err) {
    console.error('  - Liveness Endpoint (/health/live): ❌ OFFLINE', err.message);
    checkPassed = false;
  }

  // 2. Verify MongoDB Dependency Readiness
  try {
    const res = await axios.get(`${baseUrl}/health/ready`);
    console.log(`  - Readiness Endpoint (/health/ready): ✅ READY (Status: ${res.data.status})`);
  } catch (err) {
    console.error('  - Readiness Endpoint (/health/ready): ❌ DATABASE UNHEALTHY', err.message);
    checkPassed = false;
  }

  // 3. Verify FastAPI YOLO AI Health
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const res = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
    console.log(`  - FastAPI YOLO AI Microservice: ✅ ONLINE (Latency: ${res.status === 200 ? 'OK' : 'DEGRADED'})`);
  } catch (err) {
    console.warn(`  - FastAPI YOLO AI Microservice: ⚠️ OFFLINE/UNREACHABLE (${err.message})`);
    console.log('    (Note: Platform falls back to server-side severity heuristics cleanly)');
  }

  console.log('\n----------------------------------------');
  if (checkPassed) {
    console.log('🎉 POST-DEPLOYMENT VERIFICATION: COMPLETE');
    process.exit(0);
  } else {
    console.error('❌ POST-DEPLOYMENT VERIFICATION: FAILED (Critical health checks failed)');
    process.exit(1);
  }
};

runPostDeploymentCheck();
