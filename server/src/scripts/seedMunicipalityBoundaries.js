import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Municipality from '../models/Municipality.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Synthetic development municipality boundary polygons.
 * NOTE: These polygons are mathematically constructed synthetic demo boundaries for application testing,
 * not official government GIS boundary data.
 */
const demoMunicipalities = [
  {
    name: 'Demo Central Zone',
    code: 'MUN001',
    state: 'Tamil Nadu',
    district: 'Coimbatore Demo Region',
    contactEmail: 'demo.central@fixmyroad.local',
    contactPhone: '+91 422 2300000',
    notificationMethod: 'DASHBOARD',
    active: true,
    // Encloses Point A: lat 11.0168, lon 76.9558
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [76.94, 11.00], // Southwest
          [76.98, 11.00], // Southeast
          [76.98, 11.04], // Northeast
          [76.94, 11.04], // Northwest
          [76.94, 11.00], // Ring closing
        ],
      ],
    },
  },
  {
    name: 'Demo North Zone',
    code: 'MUN002',
    state: 'Tamil Nadu',
    district: 'Coimbatore Demo Region',
    contactEmail: 'demo.north@fixmyroad.local',
    contactPhone: '+91 422 2300001',
    notificationMethod: 'DASHBOARD',
    active: true,
    // Encloses Point B: lat 11.0600, lon 76.9558
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [76.94, 11.05],
          [76.98, 11.05],
          [76.98, 11.10],
          [76.94, 11.10],
          [76.94, 11.05],
        ],
      ],
    },
  },
  {
    name: 'Demo South Zone',
    code: 'MUN003',
    state: 'Tamil Nadu',
    district: 'Coimbatore Demo Region',
    contactEmail: 'demo.south@fixmyroad.local',
    contactPhone: '+91 422 2300002',
    notificationMethod: 'DASHBOARD',
    active: true,
    // Encloses Point C: lat 10.9500, lon 76.9558
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [76.94, 10.90],
          [76.98, 10.90],
          [76.98, 10.98],
          [76.94, 10.98],
          [76.94, 10.90],
        ],
      ],
    },
  },
];

const seedBoundaries = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding synthetic demo municipality boundaries and geospatial indexes...');

    let seededCount = 0;
    let mun001Id = null;

    for (const data of demoMunicipalities) {
      const municipality = await Municipality.findOneAndUpdate(
        { code: data.code },
        data,
        { upsert: true, new: true, runValidators: true }
      );
      if (data.code === 'MUN001') {
        mun001Id = municipality._id;
      }
      seededCount++;
      console.log(`  ✓ Synthetic Municipality [${municipality.code}] - ${municipality.name} boundary saved.`);
    }

    // Ensure 2dsphere index exists on boundary field
    await Municipality.collection.createIndex({ boundary: '2dsphere' });
    console.log('  ✓ 2dsphere geospatial index ensured on Municipality.boundary');

    // Associate seeded MUNICIPALITY_ADMIN account with MUN001
    if (mun001Id) {
      const adminEmail = process.env.SEED_MUNICIPALITY_EMAIL || 'municipality@fixmyroad.local';
      const updatedAdmin = await User.findOneAndUpdate(
        { email: adminEmail },
        { municipalityId: mun001Id, role: 'MUNICIPALITY_ADMIN' },
        { new: true }
      );

      if (updatedAdmin) {
        console.log(`  ✓ Associated MUNICIPALITY_ADMIN (${adminEmail}) with MUN001 (${mun001Id})`);
      }
    }

    console.log(`✅ Successfully seeded ${seededCount} synthetic demo municipality boundaries and indexes.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding municipality boundaries:', error);
    process.exit(1);
  }
};

seedBoundaries();
