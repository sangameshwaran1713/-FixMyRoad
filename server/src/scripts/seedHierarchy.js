/**
 * seedHierarchy.js
 * Seeds HierarchyLevel documents and a demo Municipality into MongoDB Atlas.
 * Run with: node server/src/scripts/seedHierarchy.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/database.js';
import HierarchyLevel from '../models/HierarchyLevel.js';
import Municipality from '../models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const HIERARCHY_LEVELS = [
  { levelName: 'Ward Officer',      levelOrder: 1, escalationSlaDays: 0.0014 }, // ~2 minutes for live demo
  { levelName: 'Zone Inspector',   levelOrder: 2, escalationSlaDays: 0.0014 },
  { levelName: 'Municipal Manager',levelOrder: 3, escalationSlaDays: 0.0014 },
  { levelName: 'District Authority',levelOrder: 4, escalationSlaDays: 0.0014 },
];

const seedHierarchy = async () => {
  console.log('🌱 Seeding Hierarchy Levels & Demo Municipality...');

  const isConnected = await connectDB();
  if (!isConnected) {
    console.error('❌ Database connection failed.');
    process.exit(1);
  }

  try {
    // 1. Seed Hierarchy Levels
    for (const level of HIERARCHY_LEVELS) {
      const existing = await HierarchyLevel.findOne({ levelOrder: level.levelOrder });
      if (existing) {
        existing.levelName = level.levelName;
        existing.escalationSlaDays = level.escalationSlaDays;
        await existing.save();
        console.log(`ℹ️  Updated: Level ${level.levelOrder} → ${level.levelName}`);
      } else {
        await HierarchyLevel.create(level);
        console.log(`✅ Created: Level ${level.levelOrder} → ${level.levelName}`);
      }
    }

    // 2. Seed a catch-all demo Municipality (covers all coordinates for testing)
    let demoMun = await Municipality.findOne({ code: 'DEMO_CENTRAL' });
    if (!demoMun) {
      demoMun = await Municipality.create({
        name: 'Central District Municipality',
        code: 'DEMO_CENTRAL',
        state: 'Tamil Nadu',
        district: 'Central District',
        contactEmail: 'municipality@fixmyroad.local',
        contactPhone: '04412345678',
        notificationMethod: 'DASHBOARD',
        active: true,
        // Wide bounding polygon covering most of India (for demo purposes)
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [68.0, 7.0],
            [97.0, 7.0],
            [97.0, 37.0],
            [68.0, 37.0],
            [68.0, 7.0],
          ]],
        },
      });
      console.log(`✅ Created Demo Municipality: ${demoMun.name} (covers all India for demo)`);
    } else {
      // Ensure boundary is updated to cover all India
      demoMun.boundary = {
        type: 'Polygon',
        coordinates: [[
          [68.0, 7.0],
          [97.0, 7.0],
          [97.0, 37.0],
          [68.0, 37.0],
          [68.0, 7.0],
        ]],
      };
      demoMun.active = true;
      demoMun.notificationMethod = 'DASHBOARD';
      await demoMun.save();
      console.log(`ℹ️  Updated Demo Municipality: ${demoMun.name}`);
    }

    console.log('\n🎉 Hierarchy & Municipality seeding complete!');
    console.log('--------------------------------------------------');
    console.log('Hierarchy Levels:');
    HIERARCHY_LEVELS.forEach(l => console.log(`  Level ${l.levelOrder}: ${l.levelName} (SLA: 2 minutes for demo)`));
    console.log(`\nDemo Municipality: ${demoMun.name} (Code: ${demoMun.code})`);
    console.log('--------------------------------------------------\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedHierarchy();
