import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  userId: string;
  title: string;
  content: string;
  images: { url: string; key: string; thumbUrl: string; thumbKey: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    images: [{
      url: { type: String, default: '' },
      key: { type: String, default: '' },
      thumbUrl: { type: String, default: '' },
      thumbKey: { type: String, default: '' },
    }],
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, createdAt: -1 });
NoteSchema.index({ userId: 1, content: 'text', title: 'text' });

const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;