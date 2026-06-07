import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIncome extends Document {
  userId: string;
  date: string;           // 日期 "2026-06-06 23:49"
  amount: number;          // 金额
  category: string;        // 二级分类: 地盘/其他/补贴/半工地盤
  note: string;            // 备注
  shift: string;           // 班次: 早班/晚班/半工/日班/补贴
  hours: number;           // 工作时长(小时)
  industry: string;        // 行业: 地盘/酒楼/补贴
  company: string;         // 公司: 煌府/国益/益哥
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: '其他' },
    note: { type: String, default: '' },
    shift: { type: String, default: '' },
    hours: { type: Number, default: 0 },
    industry: { type: String, default: '' },
    company: { type: String, default: '' },
  },
  { timestamps: true }
);

IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, industry: 1 });

const Income: Model<IIncome> =
  mongoose.models.Income || mongoose.model<IIncome>('Income', IncomeSchema);

export default Income;
