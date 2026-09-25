import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Municipality = mongoose.model('Municipality', new mongoose.Schema({}, { strict: false }));
  const HierarchyLevel = mongoose.model('HierarchyLevel', new mongoose.Schema({}, { strict: false }));

  const defaultMun = await Municipality.findOne();
  console.log('Default Municipality ID:', defaultMun ? defaultMun._id.toString() : 'NONE');

  const users = await User.find({ role: { $in: ['MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'] } });
  console.log('\n--- MUNICIPALITY OFFICERS & ADMINS ---');
  users.forEach(u => console.log(u.username, '|', u.email, '| role:', u.role, '| munId:', u.municipalityId));

  const complaints = await Complaint.find();
  console.log('\n--- COMPLAINTS ---');
  complaints.forEach(c => console.log(c.complaintId, '| status:', c.status, '| munId:', c.municipalityId, '| levelId:', c.currentHierarchyLevelId, '| sla:', c.slaDeadline));

  // Align complaint & users to same municipality if mismatch exists
  if (defaultMun && complaints.length > 0) {
    const mainMunId = complaints[0].municipalityId || defaultMun._id;
    await User.updateMany(
      { role: { $in: ['MUNICIPALITY_ADMIN', 'MUNICIPALITY_OFFICER'] } },
      { $set: { municipalityId: mainMunId } }
    );
    await Complaint.updateMany(
      {},
      { $set: { municipalityId: mainMunId, slaDeadline: new Date(Date.now() - 1000) } }
    );
    console.log('\n✅ Aligned all officers & complaints to Municipality ID:', mainMunId);
    console.log('✅ Expired SLA deadline to trigger auto-escalation cron immediately!');
  }

  process.exit(0);
}

run().catch(console.error);
