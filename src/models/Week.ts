import mongoose, { Schema, Document } from "mongoose";

export interface DayEntry {
  description: string;
  skills: string;
}

export interface IWeek extends Document {
  studentId: string;
  weekNumber: number;
  weekEnding: string;
  days: {
    monday: DayEntry;
    tuesday: DayEntry;
    wednesday: DayEntry;
    thursday: DayEntry;
    friday: DayEntry;
  };
  weeklyReport: string;
  signatureDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const DayEntrySchema = new Schema<DayEntry>(
  {
    description: { type: String, default: "" },
    skills: { type: String, default: "" },
  },
  { _id: false }
);

const WeekSchema = new Schema<IWeek>(
  {
    studentId: { type: String, required: true },
    weekNumber: { type: Number, required: true },
    weekEnding: { type: String, required: true },
    days: {
      monday: { type: DayEntrySchema, default: () => ({}) },
      tuesday: { type: DayEntrySchema, default: () => ({}) },
      wednesday: { type: DayEntrySchema, default: () => ({}) },
      thursday: { type: DayEntrySchema, default: () => ({}) },
      friday: { type: DayEntrySchema, default: () => ({}) },
    },
    weeklyReport: { type: String, default: "" },
    signatureDate: { type: String, default: "" },
  },
  { timestamps: true }
);

WeekSchema.index({ studentId: 1, weekNumber: 1 }, { unique: true });

export default mongoose.models.Week ||
  mongoose.model<IWeek>("Week", WeekSchema);
