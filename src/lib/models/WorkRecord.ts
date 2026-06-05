import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkRecord extends Document {
  userId: string;
  date: string;            // 日期 YYYY-MM-DD
  clockIn: string;         // 上班打卡时间 ISO
  clockOut: string | null; // 下班打卡时间 ISO
  location: string;        // 工作地点/区域名称
  duration: number;        // 工作时长（分钟）
  note: string;            // 备注
  createdAt: Date;
  updatedAt: Date;
}

const WorkRecordSchema = new Schema<IWorkRecord>(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true },
    clockIn: { type: String, required: true },
    clockOut: { type: String, default: null },
    location: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

WorkRecordSchema.index({ userId: 1, date: -1 });

const WorkRecord: Model<IWorkRecord> =
  mongoose.models.WorkRecord || mongoose.model<IWorkRecord>('WorkRecord', WorkRecordSchema);

export default WorkRecord;
