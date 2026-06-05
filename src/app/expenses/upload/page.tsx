'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

interface AiResult {
  fileName: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  date: string;
  aiRaw: string;
  error: string | null;
}

export default function ExpensesUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [results, setResults] = useState<AiResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!loading && !user) {
    router.push('/login');
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: { file: File; preview: string }[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      newFiles.push({ file, preview: URL.createObjectURL(file) });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setResults(null);
    setMessage(null);
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

  const analyzeWithAI = async () => {
    if (files.length === 0) return;

    setAnalyzing(true);
    setMessage(null);

    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f.file);
    }

    try {
      const res = await fetch('/api/expenses/ai-analyze', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setResults(json.data);
      } else {
        setMessage({ type: 'error', text: json.error || '识别失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' });
    } finally {
      setAnalyzing(false);
    }
  };

  const updateResult = (index: number, field: keyof AiResult, value: string | number) => {
    if (!results) return;
    const updated = [...results];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setResults(updated);
  };

  const confirmAll = async () => {
    if (!results || results.length === 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const items = [];
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.error) continue;

        const imgFormData = new FormData();
        imgFormData.append('file', files[i].file);
        imgFormData.append('title', r.fileName);
        imgFormData.append('tags', JSON.stringify(['expense', r.category]));
        imgFormData.append('fileType', 'image');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: imgFormData,
        });
        const uploadJson = await uploadRes.json();

        items.push({
          date: r.date,
          amount: r.amount,
          merchant: r.merchant,
          category: r.category,
          description: r.description,
          imageUrl: uploadJson.success ? uploadJson.data.url : '',
          aiRaw: r.aiRaw,
        });
      }

      const saveRes = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const saveJson = await saveRes.json();

      if (saveJson.success) {
        setMessage({ type: 'success', text: `成功保存 ${saveJson.data.length} 条账单记录！` });
        setFiles([]);
        setResults(null);
        setTimeout(() => router.push('/expenses'), 1500);
      } else {
        setMessage({ type: 'error', text: saveJson.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">杂费单统计</h1>
        <p className="text-gray-500 mt-1">上传费用单据图片，AI 自动识别金额并填入表格</p>
      </div>

      {(!results || results.length === 0) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 font-medium">点击上传单据图片</p>
            <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式，AI 将自动识别金额和商户</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-3">
                {files.map((f, index) => (
                  <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      ✕
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/50 px-1 py-0.5 truncate">
                      {f.file.name}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={analyzeWithAI}
                disabled={analyzing}
                className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI 识别中...（约 5-10 秒）
                  </span>
                ) : (
                  `🤖 AI 识别 ${files.length} 张单据`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">AI 识别结果（请确认或修改）</h2>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">单据</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">日期</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">商户</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">金额</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">分类</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">备注</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="w-12 h-12 rounded overflow-hidden bg-gray-100">
                        {files[index] && (
                          <img src={files[index].preview} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => updateResult(index, 'date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={r.merchant}
                        onChange={(e) => updateResult(index, 'merchant', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={r.amount}
                          onChange={(e) => updateResult(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-200 rounded text-sm font-semibold text-blue-600"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={r.category}
                        onChange={(e) => updateResult(index, 'category', e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-sm"
                      >
                        {['餐饮', '交通', '购物', '医疗', '娱乐', '居住', '通讯', '教育', '其他'].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) => updateResult(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        placeholder="备注"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
            <span className="text-sm text-gray-600">合计</span>
            <span className="text-xl font-bold text-blue-600">
              HK$ {results.filter(r => !r.error).reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </span>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={confirmAll}
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '保存中...' : '✓ 确认并保存'}
            </button>
            <button
              onClick={() => { setResults(null); setFiles([]); }}
              className="px-6 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              重新上传
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <a href="/expenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          查看历史账单统计 →
        </a>
      </div>
    </div>
  );
}
