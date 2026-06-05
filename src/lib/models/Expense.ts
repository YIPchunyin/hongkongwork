import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseStatus = 'pending' | 'recognized' | 'confirmed';

export interface IExpense extends Document {
  userId: string;
  status: ExpenseStatus;
  // Original image
  imageUrl: string;
  imageOssKey: string;
  fileName: string;
  // AI recognition result
  amount: number;
  merchant: string;
  category: string;
  description: string;
  billDate: string;
  aiRaw: string;
  // User edits before confirm
  userNote: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'recognized', 'confirmed'],
      default: 'pending',
      index: true,
    },
    imageUrl: { type: String, default: '' },
    imageOssKey: { type: String, default: '' },
    fileName: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    merchant: { type: String, default: '' },
    category: { type: String, default: '其他' },
    description: { type: String, default: '' },
    billDate: { type: String, default: '' },
    aiRaw: { type: String, default: '' },
    userNote: { type: String, default: '' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, status: 1 });
ExpenseSchema.index({ userId: 1, billDate: -1 });
// For monthly queries: extract year-month from billDate
ExpenseSchema.index({ userId: 1, billDate: 1, status: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
