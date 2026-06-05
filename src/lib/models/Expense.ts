import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  billDate: string;        // 单据日期
  amount: number;          // AI 识别金额
  merchant: string;        // 商户名称（AI 识别）
  category: string;        // 分类（餐饮/交通/购物等）
  description: string;     // 备注
  imageUrl: string;        // 原始单据图片
  imageOssKey: string;
  confirmed: boolean;      // 用户是否确认
  aiRaw: string;           // AI 返回的原始文本
  userId: string;          // 所属用户
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    billDate: { type: String, required: true },
    amount: { type: Number, required: true },
    merchant: { type: String, default: '' },
    category: { type: String, default: '其他' },
    description: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    imageOssKey: { type: String, default: '' },
    confirmed: { type: Boolean, default: false },
    aiRaw: { type: String, default: '' },
    userId: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index for efficient queries
ExpenseSchema.index({ userId: 1, billDate: -1 });
ExpenseSchema.index({ userId: 1, confirmed: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
