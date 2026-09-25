import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import Municipality from '../models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const demoMunicipalities = [
  {
    name: 'Central Metro Municipal Corporation',
    code: 'MUN001',
    state: 'Tamil Nadu',
    district: 'Chennai Central',
    contactEmail: 'central.metro@municipality.demo.gov',
    contactPhone: '+91 44 2530 0001',
    notificationMethod: 'DASHBOARD',
    active: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [80.20, 13.00],
          [80.30, 13.00],
          [80.30, 13.10],
          [80.20, 13.10],
          [80.20, 13.00]
        ]
      ]
    }
  },
  {
    name: 'North Western District Municipal Board',
    code: 'MUN002',
    state: 'Tamil Nadu',
    district: 'Coimbatore North',
    contactEmail: 'north.district@municipality.demo.gov',
    contactPhone: '+91 422 2240 002',
    notificationMethod: 'EMAIL',
    active: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [76.90, 11.00],
          [77.05, 11.00],
          [77.05, 11.15],
          [76.90, 11.15],
          [76.90, 11.00]
        ]
      ]
    }
  },
  {
    name: 'Southern Coastal Municipal Authority',
    code: 'MUN003',
    state: 'Tamil Nadu',
    district: 'Madurai South',
    contactEmail: 'south.coastal@municipality.demo.gov',
    contactPhone: '+91 452 2530 003',
    notificationMethod: 'ALL',
    active: true,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [78.05, 9.85],
          [78.20, 9.85],
          [78.20, 10.00],
          [78.05, 10.00],
          [78.05, 9.85]
        ]
      ]
    }
  }
];

const seedMunicipalities = async () => {
  console.log('🌱 Starting FixMyRoad Municipality Seeding...');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Database connection failed. Aborting seed operation.');
    process.exit(1);
  }

  try {
    for (const item of demoMunicipalities) {
      let mun = await Municipality.findOne({ code: item.code });

      if (mun) {
        console.log(`ℹ️ Municipality ${item.code} (${item.name}) already exists. Updating details...`);
        Object.assign(mun, item);
        await mun.save();
      } else {
        await Municipality.create(item);
        console.log(`✅ Created Municipality ${item.code}: ${item.name}`);
      }
    }

    console.log('\n🎉 Municipality seeding completed successfully!');
    console.log('--------------------------------------------------');
    demoMunicipalities.forEach((m) => console.log(`• [${m.code}] ${m.name} (${m.district}, ${m.state})`));
    console.log('--------------------------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during municipality seeding:', error);
    process.exit(1);
  }
};

seedMunicipalities();
