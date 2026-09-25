import mongoose from 'mongoose';

const hierarchyLevelSchema = new mongoose.Schema(
  {
    levelName: {
      type: String,
      required: true,
      unique: true, // e.g. "Ward", "Zone", "Municipal", "District"
    },
    levelOrder: {
      type: Number,
      required: true,
      unique: true, // 1 for Ward, 2 for Zone, etc.
    },
    escalationSlaDays: {
      type: Number,
      default: 3, // days to wait before escalating to the next level
    }
  },
  { timestamps: true }
);

const HierarchyLevel = mongoose.model('HierarchyLevel', hierarchyLevelSchema);
export default HierarchyLevel;
