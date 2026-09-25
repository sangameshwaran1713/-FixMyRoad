import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGO_URI is missing!');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Municipality = mongoose.model('Municipality', new mongoose.Schema({}, { strict: false }));
  const HierarchyLevel = mongoose.model('HierarchyLevel', new mongoose.Schema({}, { strict: false }));

  const defaultMun = await Municipality.findOne();
  console.log('Default Municipality ID:', defaultMun ? defaultMun._id.toString() : 'NONE');

  const level1 = await HierarchyLevel.findOne({ levelOrder: 1 });
  console.log('Level 1 ID:', level1 ? level1._id.toString() : 'NONE');

  if (defaultMun) {
    const usersRes = await User.updateMany(
      { role: { $in: ['MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'] }, municipalityId: null },
      { $set: { municipalityId: defaultMun._id } }
    );
    console.log('Linked Officers to Municipality:', usersRes.modifiedCount);

    const compRes = await Complaint.updateMany(
      { municipalityId: null },
      { $set: { municipalityId: defaultMun._id } }
    );
    console.log('Linked Complaints to Municipality:', compRes.modifiedCount);
  }

  // Ensure all complaints have hierarchy level & active 2 min SLA deadline
  if (level1) {
    const slaDeadline = new Date(Date.now() + 2 * 60 * 1000);
    const hierRes = await Complaint.updateMany(
      { currentHierarchyLevelId: null },
      { $set: { currentHierarchyLevelId: level1._id, slaDeadline } }
    );
    console.log('Set Hierarchy & SLA for complaints:', hierRes.modifiedCount);
  }

  const complaints = await Complaint.find();
  console.log('\n--- ALL COMPLAINTS IN DB ---');
  complaints.forEach(c => {
    console.log('ID:', c.complaintId, '| Status:', c.status, '| Municipality:', c.municipalityId, '| Level:', c.currentHierarchyLevelId, '| SLA:', c.slaDeadline);
  });

  process.exit(0);
}

run().catch(console.error);
