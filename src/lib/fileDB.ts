import fs from 'fs';
import path from 'path';
import { MediaItem } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'media.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readMedia(): MediaItem[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeMedia(items: MediaItem[]): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

let nextId = 1;
function generateId(): string {
  // 从现有数据中找最大 id
  const items = readMedia();
  const maxId = items.reduce((max, item) => {
    const num = parseInt(item._id || '0', 10);
    return num > max ? num : max;
  }, 0);
  nextId = maxId + 1;
  return String(nextId);
}

export const fileDB = {
  create(data: Omit<MediaItem, '_id'>): MediaItem {
    const items = readMedia();
    const newItem: MediaItem = {
      ...data,
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    writeMedia(items);
    return newItem;
  },

  find(query: {
    tag?: string;
    search?: string;
    type?: 'image' | 'video';
    page?: number;
    limit?: number;
  }): { items: MediaItem[]; total: number; page: number; limit: number; totalPages: number } {
    let items = readMedia();

    // 过滤
    if (query.type) {
      items = items.filter((item) => item.type === query.type);
    }
    if (query.tag) {
      items = items.filter((item) =>
        item.tags.some((t) => t.toLowerCase() === query.tag!.toLowerCase())
      );
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(s) ||
          (item.description || '').toLowerCase().includes(s) ||
          item.tags.some((t) => t.toLowerCase().includes(s))
      );
    }

    const total = items.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);

    return {
      items: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findById(id: string): MediaItem | null {
    const items = readMedia();
    return items.find((item) => item._id === id) || null;
  },

  update(id: string, data: Partial<MediaItem>): MediaItem | null {
    const items = readMedia();
    const index = items.findIndex((item) => item._id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    writeMedia(items);
    return items[index];
  },

  delete(id: string): boolean {
    const items = readMedia();
    const index = items.findIndex((item) => item._id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    writeMedia(items);
    return true;
  },

  getTags(): { name: string; count: number }[] {
    const items = readMedia();
    const tagMap = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
};
