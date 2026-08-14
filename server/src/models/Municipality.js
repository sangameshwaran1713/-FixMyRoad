import mongoose from 'mongoose';

const municipalitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Municipality name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Municipality code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    notificationMethod: {
      type: String,
      enum: ['EMAIL', 'SMS', 'DASHBOARD', 'ALL'],
      default: 'DASHBOARD',
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true,
        default: 'Polygon',
      },
      coordinates: {
        type: Array,
        required: true,
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index on GeoJSON boundary field for spatial queries
municipalitySchema.index({ boundary: '2dsphere' });

const Municipality = mongoose.model('Municipality', municipalitySchema);

export default Municipality;
