import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Municipality from '../models/Municipality.js';
import Complaint from '../models/Complaint.js';
import ComplaintHistory from '../models/ComplaintHistory.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Counter from '../models/Counter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const inspectDb = async () => {
  console.log('🔍 FixMyRoad Database Inspection Utility');
  console.log('==================================================');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Database connection failed.');
    process.exit(1);
  }

  try {
    const models = [
      { name: 'Users', model: User },
      { name: 'Municipalities', model: Municipality },
      { name: 'Complaints', model: Complaint },
      { name: 'ComplaintHistory', model: ComplaintHistory },
      { name: 'Notifications', model: Notification },
      { name: 'AuditLogs', model: AuditLog },
      { name: 'Counters', model: Counter },
    ];

    for (const item of models) {
      const count = await item.model.countDocuments();
      const indexes = await item.model.schema.indexes();
      const indexNames = indexes.map((idx) => Object.keys(idx[0]).join('+')).join(', ');

      console.log(`📌 Collection: [${item.name}]`);
      console.log(`   • Total Records: ${count}`);
      console.log(`   • Schema Indexes: ${indexNames || 'Default _id'}`);
      console.log('--------------------------------------------------');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inspecting database:', error);
    process.exit(1);
  }
};

inspectDb();
