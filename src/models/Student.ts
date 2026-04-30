import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  githubId: string;
  email: string;
  name: string;
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
    attachmentFrom: { type: String, default: "" },
    attachmentTo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
