import mongoose, { Schema, Document, Model } from 'mongoose';
import { MediaItem } from '@/lib/types';

export interface IMedia extends Document, Omit<MediaItem, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    ossKey: {
      type: String,
      required: true,
      unique: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 为标签搜索建立文本索引
MediaSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
