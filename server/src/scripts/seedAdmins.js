import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Municipality from '../models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmins = async () => {
  console.log('🌱 Starting FixMyRoad Admin & Officer Account Seeding...');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Database connection failed. Aborting seed operation.');
    process.exit(1);
  }

  const superAdminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@fixmyroad.local').toLowerCase();
  const superAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  const municipalityAdminEmail = (process.env.SEED_MUNICIPALITY_EMAIL || 'municipality@fixmyroad.local').toLowerCase();
  const municipalityAdminPassword = process.env.SEED_MUNICIPALITY_PASSWORD || 'Municipality@12345';

  const officerEmail = (process.env.SEED_OFFICER_EMAIL || 'officer@fixmyroad.local').toLowerCase();
  const officerPassword = process.env.SEED_OFFICER_PASSWORD || 'Officer@12345';

  try {
    const demoMun = await Municipality.findOne({ active: true });

    // 1. Seed SUPER_ADMIN
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (superAdmin) {
      console.log(`ℹ️ Super Admin account already exists (${superAdminEmail}). Updating password...`);
      superAdmin.password = superAdminPassword;
      superAdmin.role = 'SUPER_ADMIN';
      superAdmin.isActive = true;
      await superAdmin.save();
    } else {
      superAdmin = await User.create({
        name: 'System Super Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        phone: '1112223333',
        role: 'SUPER_ADMIN',
        isActive: true,
      });
      console.log(`✅ Created Super Admin account: ${superAdminEmail}`);
    }

    // 2. Seed MUNICIPALITY_ADMIN
    let municipalityAdmin = await User.findOne({ email: municipalityAdminEmail });
    if (municipalityAdmin) {
      console.log(`ℹ️ Municipality Admin account already exists (${municipalityAdminEmail}). Updating password...`);
      municipalityAdmin.password = municipalityAdminPassword;
      municipalityAdmin.role = 'MUNICIPALITY_ADMIN';
      if (demoMun) municipalityAdmin.municipalityId = demoMun._id;
      municipalityAdmin.isActive = true;
      await municipalityAdmin.save();
    } else {
      municipalityAdmin = await User.create({
        name: 'Central District Municipal Admin',
        email: municipalityAdminEmail,
        password: municipalityAdminPassword,
        phone: '4445556666',
        role: 'MUNICIPALITY_ADMIN',
        municipalityId: demoMun ? demoMun._id : null,
        isActive: true,
      });
      console.log(`✅ Created Municipality Admin account: ${municipalityAdminEmail}`);
    }

    // 3. Seed MUNICIPALITY_OFFICER
    let officer = await User.findOne({ email: officerEmail });
    if (officer) {
      console.log(`ℹ️ Municipal Officer account already exists (${officerEmail}). Updating password...`);
      officer.password = officerPassword;
      officer.role = 'MUNICIPALITY_OFFICER';
      if (demoMun) officer.municipalityId = demoMun._id;
      officer.isActive = true;
      await officer.save();
    } else {
      officer = await User.create({
        name: 'Officer John Maintenance',
        email: officerEmail,
        password: officerPassword,
        phone: '7778889999',
        role: 'MUNICIPALITY_OFFICER',
        municipalityId: demoMun ? demoMun._id : null,
        isActive: true,
      });
      console.log(`✅ Created Municipal Officer account: ${officerEmail}`);
    }

    console.log('\n🎉 Admin & Officer account seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log(`SUPER_ADMIN Email: ${superAdminEmail} / Password: ${superAdminPassword}`);
    console.log(`MUNICIPALITY_ADMIN Email: ${municipalityAdminEmail} / Password: ${municipalityAdminPassword}`);
    console.log(`MUNICIPALITY_OFFICER Email: ${officerEmail} / Password: ${officerPassword}`);
    console.log('--------------------------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedAdmins();
