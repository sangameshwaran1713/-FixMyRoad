import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server/.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
  const HierarchyLevel = mongoose.model('HierarchyLevel', new mongoose.Schema({}, { strict: false }));

  const level1 = await HierarchyLevel.findOne({ levelOrder: 1 });
  if (!level1) {
    console.error('Level 1 hierarchy level not found');
    process.exit(1);
  }

  // Reset complaint to Level 1 (Ward Officer) and set SLA deadline to 2 minutes from now
  const newSla = new Date(Date.now() + 2 * 60 * 1000);
  await Complaint.updateMany(
    {},
    {
      $set: {
        status: 'SUBMITTED',
        currentHierarchyLevelId: level1._id,
        slaDeadline: newSla
      }
    }
  );

  console.log('✅ Reset complaint status to SUBMITTED');
  console.log('✅ Reset hierarchy level to Level 1: Ward Officer');
  console.log('✅ Set fresh 2-minute SLA deadline:', newSla.toLocaleString());

  process.exit(0);
}

run().catch(console.error);
