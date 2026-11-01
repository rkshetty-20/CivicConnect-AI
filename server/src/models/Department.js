import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a department name'],
      unique: true,
      trim: true,
    },
    category: {
      type: [String],
      default: [], // Mapped categories: e.g. ["Garbage", "Sewage"]
    },
    contactEmail: {
      type: String,
      required: [true, 'Please provide a contact email'],
      trim: true,
      lowercase: true,
    },
    officersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model('Department', departmentSchema);
export default Department;
