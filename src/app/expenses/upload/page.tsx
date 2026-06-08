'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

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

interface ImageFile {
  file: File;
  preview: string;
  rotation: number;
  mode: string;
  manualAmount: string;
  manualMerchant: string;
  manualCategory: string;
  manualDate: string;
  manualDesc: string;
}

const DEFAULT_CATEGORIES = ['工具', '交通', '其他'];
const CATEGORIES = DEFAULT_CATEGORIES;

function rotateBase64Image(base64: string, rotation: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const angle = rotation * 90;
      const rad = (angle * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      canvas.width = img.width * cos + img.height * sin;
      canvas.height = img.width * sin + img.height * cos;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(rotatedDataUrl);
    };
    img.onerror = reject;
    img.src = base64;
  });
}

function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}



function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const rotRad = getRadianAngle(rotation);
    const bBox = rotateSize(image.width, image.height, rotation);
    canvas.width = bBox.width;
    canvas.height = bBox.height;
    ctx.translate(bBox.width / 2, bBox.height / 2);
    ctx.rotate(rotRad);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return null;
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;
    croppedCtx.drawImage(canvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      croppedCanvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  } catch (err) {
    return null;
  }
}
export default function ExpensesUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<ImageFile[]>([]);
  const [results, setResults] = useState<UploadResult[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [editSrc, setEditSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [editorRotation, setEditorRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropAspect, setCropAspect] = useState(4 / 3);
  
  
  const today = new Date().toISOString().split('T')[0];

  if (!loading && !user) { router.push('/login'); return null; }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: ImageFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      newFiles.push({
        file: selected[i],
        preview: URL.createObjectURL(selected[i]),
        rotation: 0,
        mode: 'manual',
        manualAmount: '',
        manualMerchant: '',
        manualCategory: CATEGORIES[0],
        manualDate: today,
        manualDesc: '',
      });
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


  const openEditor = (index: number) => {
    setEditIndex(index);
    setEditSrc(files[index].preview);
    setCrop({ x: 0, y: 0 });
    setCropZoom(1);
    setEditorRotation(0);
    setCroppedAreaPixels(null);
    setEditorOpen(true);
  };

  const applyCrop = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(editSrc, croppedAreaPixels, editorRotation);
      if (blob) {
        const newPreview = URL.createObjectURL(blob);
        setFiles((prev) => {
          const updated = [...prev];
          URL.revokeObjectURL(updated[editIndex].preview);
          updated[editIndex] = {
            ...updated[editIndex],
            preview: newPreview,
            file: new File([blob], updated[editIndex].file.name, { type: updated[editIndex].file.type }),
            rotation: 0,
          };
          return updated;
        });
      }
    } catch (err) {
      console.error('applyCrop error:', err);
    }
    setEditorOpen(false);
  };

  const rotateFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], rotation: (updated[index].rotation + 1) % 4 };
      return updated;
    });
  };

  const getRotationStyle = (rotation: number): React.CSSProperties => ({
    transform: `rotate(${rotation * 90}deg)`,
    transition: 'transform 0.3s ease',
  });

  const toggleImageMode = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], mode: updated[index].mode === 'ai' ? 'manual' : 'ai' };
      return updated;
    });
  };

  const updateManualField = (index: number, field: string, value: string) => {
    setFiles((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const handleAiUpload = async () => {
    const aiFiles = files.filter((f) => f.mode === 'ai');
    if (aiFiles.length === 0) { alert('请选择要 AI 识别的图片'); return; }
    setUploading(true);
    const formData = new FormData();
    for (const f of aiFiles) {
      if (f.rotation !== 0) {
        try {
          const rotatedDataUrl = await rotateBase64Image(f.preview, f.rotation);
          const rotatedBlob = dataURLtoBlob(rotatedDataUrl);
          formData.append('files', rotatedBlob, f.file.name);
        } catch {
          formData.append('files', f.file);
        }
      } else {
        formData.append('files', f.file);
      }
    }
    try {
      const res = await fetch('/api/expenses', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setResults((prev) => [...(prev || []), ...json.data]);
        setTotalAmount((prev) => prev + (json.totalAmount || 0));
      } else {
        alert(json.error || '上传失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setUploading(false);
    }
  };

  const handleManualUpload = async () => {
    const manualFiles = files.filter((f) => f.mode === 'manual');
    if (manualFiles.length === 0) { alert('请选择手动填写的图片'); return; }
    for (const f of manualFiles) {
      if (!f.manualAmount || parseFloat(f.manualAmount) <= 0) {
        alert('请填写有效金额');
        return;
      }
    }
    setUploading(true);
    try {
      for (const f of manualFiles) {
        const imgFormData = new FormData();
        if (f.rotation !== 0) {
          try {
            const rotatedDataUrl = await rotateBase64Image(f.preview, f.rotation);
            const rotatedBlob = dataURLtoBlob(rotatedDataUrl);
            imgFormData.append('files', rotatedBlob, f.file.name);
          } catch {
            imgFormData.append('files', f.file);
          }
        } else {
          imgFormData.append('files', f.file);
        }
        
        // Upload image to get a record with imageUrl
        const uploadRes = await fetch('/api/expenses', { method: 'POST', body: imgFormData });
        const uploadJson = await uploadRes.json();
        
        if (uploadJson.success && uploadJson.data.length > 0) {
          const record = uploadJson.data[0];
          // Update the record with manual data
          await fetch('/api/expenses/' + record._id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: parseFloat(f.manualAmount),
              merchant: f.manualMerchant,
              category: f.manualCategory,
              billDate: f.manualDate,
              description: f.manualDesc,
              status: 'confirmed',
            }),
          });
          setResults((prev) => [...(prev || []), { 
            ...record, 
            amount: parseFloat(f.manualAmount),
            merchant: f.manualMerchant,
            category: f.manualCategory,
            billDate: f.manualDate,
            description: f.manualDesc,
          }]);
          setTotalAmount((prev) => prev + parseFloat(f.manualAmount));
        } else {
          alert('图片上传失败');
        }
      }
    } catch {
      alert('网络错误');
    } finally {
      setUploading(false);
    }
  };

  const hasAiFiles = files.some((f) => f.mode === 'ai');
  const hasManualFiles = files.some((f) => f.mode === 'manual');
  const aiCount = files.filter((f) => f.mode === 'ai').length;
  const manualCount = files.filter((f) => f.mode === 'manual').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">杂费单</h1>
          <p className="text-sm text-gray-500 mt-1">上传图片后选择 AI 识别或手动填写</p>
        </div>
      </div>

      {!results ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Upload area - always shown first */}
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

          {/* File previews */}
          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                    {/* Image preview with rotation */}
                    <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                      <img
                        src={f.preview}
                        alt=""
                        className="max-w-full max-h-full object-contain cursor-pointer"
                        style={getRotationStyle(f.rotation)}
                        onClick={(e) => { e.stopPropagation(); openEditor(i); }}
                      />
                      {/* Always-visible rotate and delete buttons */}
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditor(i); }}
                          className="w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-base hover:bg-blue-500/80 shadow"
                          title="放大查看"
                        >
                          🔍
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); rotateFile(i); }}
                          className="w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-base hover:bg-black/80 shadow"
                          title="点击旋转 90°"
                        >
                          ↻
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center text-base hover:bg-red-500/80 shadow"
                          title="删除"
                        >
                          ✕
                        </button>
                      </div>
                      {/* Mode badge */}
                      <div className="absolute bottom-1 left-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleImageMode(i); }}
                          className={
                            'text-xs px-2 py-0.5 rounded-full font-medium shadow border ' +
                            (f.mode === 'ai'
                              ? 'bg-blue-500 text-white border-blue-400'
                              : 'bg-green-500 text-white border-green-400')
                          }
                        >
                          {f.mode === 'ai' ? '🤖 AI' : '✏️ 手动'}
                        </button>
                      </div>
                    </div>
                    {/* File name */}
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-gray-500 truncate">{f.file.name}</p>
                    </div>

                    {/* Manual form (shown when mode = manual) */}
                    {f.mode === 'manual' && (
                      <div className="px-2 pb-3 space-y-2 border-t border-gray-200 pt-2 bg-gray-50/50">
                        <div>
                          <input
                            type="number" step="0.01" placeholder="金额 (HK$)"
                            value={f.manualAmount}
                            onChange={(e) => updateManualField(i, 'manualAmount', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text" placeholder="分类"
                            value={f.manualCategory}
                            onChange={(e) => updateManualField(i, 'manualCategory', e.target.value)}
                            list={"cat-suggestions-" + i}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                          <datalist id={"cat-suggestions-" + i}>
                            {DEFAULT_CATEGORIES.map((c: string) => <option key={c} value={c} />)}
                          </datalist>
                          <input
                            type="date"
                            value={f.manualDate}
                            max={today}
                            onChange={(e) => updateManualField(i, 'manualDate', e.target.value)}
                            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text" placeholder="备注（可选）"
                            value={f.manualDesc}
                            onChange={(e) => updateManualField(i, 'manualDesc', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {hasAiFiles && (
                  <button
                    onClick={handleAiUpload}
                    disabled={uploading}
                    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all min-h-[48px]"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        处理中...
                      </span>
                    ) : (
                      '🤖 AI 识别 (' + aiCount + ' 张)'
                    )}
                  </button>
                )}
                {hasManualFiles && (
                  <button
                    onClick={handleManualUpload}
                    disabled={uploading}
                    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all min-h-[48px]"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        提交中...
                      </span>
                    ) : (
                      '✓ 提交手动 (' + manualCount + ' 张)'
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">已提交</h2>
              <span className="text-sm text-gray-400">{results.length} 张</span>
            </div>

            <div className="space-y-3">
              {results.map((r) => (
                <div key={r._id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  {r.imageUrl && (
                    <img src={r.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium text-gray-800">{r.merchant || '未填写'}</p>
                    <p className="text-blue-600 font-semibold">HK$ {r.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{r.category}{r.billDate ? ' · ' + r.billDate : ''}</p>
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
                继续
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image lightbox using yet-another-react-lightbox */}
      {/* Image editor with crop/rotate/zoom */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setEditorOpen(false)}
        >
          <div className="relative w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-black/40">
              <button onClick={() => setEditorOpen(false)} className="text-white/70 hover:text-white text-sm">
                ✕ 取消
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditorRotation((r) => (r + 90) % 360)}
                  className="text-white/80 hover:text-white text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ↻ 旋转
                </button>
                <button
                  onClick={applyCrop}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-1.5 rounded-lg transition-colors"
                >
                  ✔ 应用
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <Cropper
                image={editSrc}
                crop={crop}
                zoom={cropZoom}
                rotation={editorRotation}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setCropZoom}
                onCropComplete={(_: Area, croppedPixels: Area) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            <div className="px-4 py-3 bg-black/40 flex items-center gap-4 justify-center">
              <span className="text-white/60 text-xs">缩放</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={(e) => setCropZoom(Number(e.target.value))}
                className="w-32 accent-blue-500"
              />
              <span className="text-white/60 text-xs">{Math.round(cropZoom * 100)}%</span>
              <div className="w-px h-6 bg-white/20" />
              <span className="text-white/60 text-xs">比例</span>
              <select
                value={cropAspect}
                onChange={(e) => setCropAspect(Number(e.target.value))}
                className="bg-white/10 text-white text-xs border border-white/20 rounded px-2 py-1"
              >
                <option value={4 / 3}>自由</option>
                <option value={1 / 1}>1:1</option>
                <option value={3 / 4}>3:4</option>
                <option value={16 / 9}>16:9</option>
              </select>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
