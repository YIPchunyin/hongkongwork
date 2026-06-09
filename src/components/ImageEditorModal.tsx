'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageEditorModalProps {
  imageUrl: string;
  onSave: (editedDataUrl: string) => void;
  onClose: () => void;
}

export default function ImageEditorModal({ imageUrl, onSave, onClose }: ImageEditorModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let editor: any = null;
    let mounted = true;

    const init = async () => {
      try {
        const ImageEditor = (await import('tui-image-editor')).default;
        await import('tui-image-editor/dist/tui-image-editor.css');

        if (!mounted || !containerRef.current) return;

          const maxW = window.innerWidth - 32;
          const maxH = window.innerHeight - 160;

          editor = new ImageEditor(containerRef.current, {
            cssMaxWidth: maxW,
            cssMaxHeight: maxH,
            selectionStyle: {
              cornerSize: 20,
              rotatingPointOffset: 70,
            },
            includeUI: {
              loadImage: {
                path: imageUrl,
                name: 'image',
              },
              theme: {
                'common.bi.image': '',
                'common.bisize.width': '0px',
                'common.bisize.height': '0px',
                'common.backgroundImage': 'none',
                'common.backgroundColor': '#1a1a2e',
                'common.border': '1px solid #333',
                'header.backgroundImage': 'none',
                'header.backgroundColor': '#1e1e32',
                'header.border': '1px solid #333',
              },
              menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'text', 'filter'],
              uiSize: { width: '100%', height: '100%' },
              menuBarPosition: 'bottom',
            },
          });
          editorRef.current = editor;
          // Listen for image load
          editor.on('load', () => { if (mounted) setLoading(false); });
          // Fallback timeout
          setTimeout(() => { if (mounted) setLoading(false); }, 5000);
      } catch (err) {
        console.error('ImageEditor init error:', err);
        setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (editor) {
        try { editor.destroy(); } catch {}
        editorRef.current = null;
      }
    };
  }, [imageUrl]);

  const handleSave = async () => {
    const editor = editorRef.current;
    if (!editor || saving) return;
    setSaving(true);
    try {
      const dataUrl = editor.toDataURL();
      onSave(dataUrl);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e32] border-b border-gray-800 shrink-0 z-10">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white font-medium text-sm">图片编辑</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? '保存中...' : '完成'}
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">加载图片编辑器中...</span>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" />
    </div>
  );
}
