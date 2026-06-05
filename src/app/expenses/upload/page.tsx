'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface UploadResult {
  _id: string;
  fileName: string;
  imageUrl: string;
  amount: number;
  merchant: string;
  category: string;
  billDate: string;
  description: string;
  error?: string;
}

export default function ExpensesUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  if (!loading && !user) { router.push('/login'); return null; }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: { file: File; preview: string }[] = [];
    for (let i = 0; i < selected.length; i++) {
      newFiles.push({ file: selected[i], preview: URL.createObjectURL(selected[i]) });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setResults(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    setResults(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    for (const f of files) formData.append('files', f.file);

    try {
      const res = await fetch('/api/expenses', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setResults(json.data);
        setTotalAmount(json.totalAmount || 0);
      } else {
        alert(json.error || '上传失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">上传杂费单</h1>
        <p className="text-sm text-gray-500 mt-1">上传后 AI 自动识别金额和商户信息</p>
      </div>

      {!results ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 font-medium">点击选择单据图片</p>
            <p className="text-xs text-gray-400 mt-1">支持 JPG / PNG，可多选</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Previews */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removeFile(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all min-h-[48px]"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    AI 识别中...
                  </span>
                ) : (
                  `上传 ${files.length} 张并 AI 识别`
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">AI 识别完成</h2>
              <span className="text-sm text-gray-400">{results.length} 张</span>
            </div>

            <div className="space-y-3">
              {results.map((r) => (
                <div key={r._id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <img src={r.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium text-gray-800">{r.merchant || '未识别'}</p>
                    <p className="text-blue-600 font-semibold">HK$ {r.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{r.category}{r.billDate ? ` · ${r.billDate}` : ''}</p>
                    {r.error && <p className="text-xs text-red-500 mt-0.5">{r.error}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex justify-between items-center">
              <span className="text-sm text-gray-600">合计</span>
              <span className="text-xl font-bold text-blue-600">HK$ {totalAmount.toFixed(2)}</span>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => router.push('/expenses/review')}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                去确认信息
              </button>
              <button
                onClick={() => { setResults(null); setFiles([]); }}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                继续上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
