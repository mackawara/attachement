import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  githubId: string;
  email: string;
  name: string;
  gender: "male" | "female";
  pin: string;
  faculty: string;
  program: string;
  courseCode: string;
  year: string;
  companyName: string;
  companyAddress: string;
  supervisorName: string;
  supervisorDesignation: string;
  supervisorTelephone: string;
  supervisorMobile: string;
  supervisorEmail: string;
  attachmentFrom: string;
  attachmentTo: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    githubId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    pin: { type: String, required: true },
    faculty: { type: String, default: "Faculty of Technology" },
    program: { type: String, default: "" },
    courseCode: { type: String, default: "" },
    year: { type: String, default: "" },
    companyName: { type: String, default: "" },
    companyAddress: { type: String, default: "" },
    supervisorName: { type: String, default: "" },
    supervisorDesignation: { type: String, default: "" },
    supervisorTelephone: { type: String, default: "" },
    supervisorMobile: { type: String, default: "" },
    supervisorEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    attachmentFrom: { type: String, default: "" },
    attachmentTo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
