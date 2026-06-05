'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TagInput from './TagInput';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileWithPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null, type: 'image' | 'video') => {
      if (!selectedFiles) return;

      const newFiles: FileWithPreview[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type,
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
      if (!title && newFiles.length > 0) {
        setTitle(newFiles[0].file.name.replace(/\.[^/.]+$/, ''));
      }
    },
    [title]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadSingleFile = (file: File, fileType: 'image' | 'video'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name.replace(/\.[^/.]+$/, ''));
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags));
      formData.append('fileType', fileType);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress((prev) => {
            const currentFileProgress = Math.round((e.loaded / e.total) * 100);
            return Math.round((successCount * 100 + currentFileProgress) / files.length);
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) resolve();
            else reject(new Error(data.error || '上传失败'));
          } catch { reject(new Error('服务器响应异常')); }
        } else {
          reject(new Error(`上传失败 (${xhr.status})`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('网络错误，请重试')));
      xhr.addEventListener('abort', () => reject(new Error('上传已取消')));
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMsg('请先选择文件');
      return;
    }
    setStatus('uploading');
    setErrorMsg('');
    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const { file, type } = files[i];
      try {
        await uploadSingleFile(file, type);
        count++;
        setSuccessCount(count);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : '上传失败');
        setStatus('error');
        return;
      }
    }
    setProgress(100);
    setStatus('success');
    setFiles([]);
    setTags([]);
    setTitle('');
    setDescription('');
    setTimeout(() => { router.push('/gallery'); router.refresh(); }, 1500);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* File selection */}
      <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 px-4 py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors active:bg-blue-50 active:scale-[0.98] min-h-[120px]"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">选择图片</span>
            <span className="text-xs text-gray-400 hidden sm:inline">JPG / PNG / WebP</span>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileSelect(e.target.files, 'image')} className="hidden" />
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 px-4 py-8 sm:py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-colors active:bg-purple-50 active:scale-[0.98] min-h-[120px]"
          >
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-600">选择视频</span>
            <span className="text-xs text-gray-400 hidden sm:inline">MP4 / WebM / MOV</span>
            <input ref={videoInputRef} type="file" accept="video/*" multiple onChange={(e) => handleFileSelect(e.target.files, 'video')} className="hidden" />
          </button>
        </div>

        {/* File previews - responsive grid */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
            {files.map((f, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                {f.type === 'image' ? (
                  <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={f.preview} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          标题 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给媒体取个名字..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="添加一些描述信息..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
        <TagInput tags={tags} onChange={setTags} placeholder="输入标签后按 Enter 添加" />
      </div>

      {/* Upload status */}
      {status !== 'idle' && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm">
            {status === 'uploading' && (
              <span className="text-blue-600">
                正在上传... {progress}%（{successCount}/{files.length} 个文件）
              </span>
            )}
            {status === 'success' && (
              <span className="text-green-600">✓ 上传成功！共 {successCount} 个文件，即将跳转到画廊...</span>
            )}
            {status === 'error' && <span className="text-red-600">✕ {errorMsg}</span>}
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={status === 'uploading' || files.length === 0}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm min-h-[48px] text-base"
      >
        {status === 'uploading'
          ? '上传中...'
          : `上传到云端${files.length > 0 ? ` (${files.length} 个文件)` : ''}`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        文件将通过 API 上传至服务器本地磁盘存储（模拟云存储效果）
      </p>
    </div>
  );
}
