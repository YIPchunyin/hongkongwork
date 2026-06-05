// 媒体类型定义（用于前后端共享，避免引入 mongoose）
export interface MediaItem {
  _id?: string;
  title: string;
  description?: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  ossKey: string;
  tags: string[];
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}
