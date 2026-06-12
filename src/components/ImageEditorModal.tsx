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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let editor: any = null;
    let mounted = true;

    const loadImageAsDataUrl = async (url: string): Promise<string> => {
      // Use our own proxy API to avoid CORS issues
      const proxyUrl = '/api/image-proxy?url=' + encodeURIComponent(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Proxy fetch failed: ' + response.status);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const init = async () => {
      try {
        if (!containerRef.current || !mounted) return;

        // First load the image as data URL to avoid CORS issues
        let dataUrl: string;
        try {
          dataUrl = await loadImageAsDataUrl(imageUrl);
        } catch {
          // If all loading fails, use the original URL and hope for the best
          dataUrl = imageUrl;
        }

        if (!mounted || !containerRef.current) return;

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
              path: dataUrl,
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
        // Add mobile-friendly CSS overrides
        const style = document.createElement("style");
        style.textContent = `
          .tui-image-editor-main-container { touch-action: manipulation; }
          .tui-image-editor-menu { flex-wrap: wrap !important; gap: 2px !important; padding: 4px !important; }
          .tui-image-editor-menu > li > div { min-width: 36px !important; min-height: 36px !important; }
          .tui-image-editor-submenu { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .tui-image-editor-submenu-item { min-width: 40px !important; min-height: 40px !important; }
          @media (max-width: 640px) {
            .tui-image-editor-menu > li > div { min-width: 44px !important; min-height: 44px !important; }
            .tui-image-editor-submenu-item { min-width: 48px !important; min-height: 48px !important; }
            .tui-image-editor-submenu-item > div > div { width: 24px !important; height: 24px !important; }
            .tui-image-editor-submenu-label { font-size: 10px !important; }
            .tui-image-editor-submenu li { padding: 6px 4px !important; }
            .tui-image-editor-submenu-item svg { width: 22px !important; height: 22px !important; }
            .tui-image-editor-cancel-btn, .tui-image-editor-apply-btn { min-width: 60px !important; min-height: 40px !important; font-size: 14px !important; padding: 8px 16px !important; }
          }
        `;
        document.head.appendChild(style);
                setTimeout(() => { if (mounted) setLoading(false); }, 8000);
      } catch (err) {
        console.error('ImageEditor init error:', err);
        if (mounted) {
          setLoadError(true);
          setLoading(false);
        }
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

  const handleRetry = () => {
    setLoadError(false);
    setLoading(true);
    // Force re-mount by changing key - handled by parent
    window.location.reload();
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
        <style dangerouslySetInnerHTML={{__html:
        ".tui-image-editor-main-container { touch-action: manipulation; }" +
        ".tui-image-editor-menu { flex-wrap: wrap !important; gap: 2px !important; padding: 4px !important; }" +
        ".tui-image-editor-menu > li > div { min-width: 36px !important; min-height: 36px !important; }" +
        ".tui-image-editor-submenu { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }" +
        ".tui-image-editor-submenu-item { min-width: 40px !important; min-height: 40px !important; }" +
        "@media (max-width: 640px) {" +
        ".tui-image-editor-menu > li > div { min-width: 44px !important; min-height: 44px !important; }" +
        ".tui-image-editor-submenu-item { min-width: 48px !important; min-height: 48px !important; }" +
        ".tui-image-editor-submenu-item > div > div { width: 24px !important; height: 24px !important; }" +
        ".tui-image-editor-submenu-label { font-size: 10px !important; }" +
        ".tui-image-editor-submenu li { padding: 6px 4px !important; }" +
        ".tui-image-editor-submenu-item svg { width: 22px !important; height: 22px !important; }" +
        ".tui-image-editor-cancel-btn, .tui-image-editor-apply-btn { min-width: 60px !important; min-height: 44px !important; font-size: 14px !important; padding: 8px 16px !important; }" +
        "}"
      }}></style><span className="text-white font-medium text-sm">图片编辑</span>
        <button
          onClick={handleSave}
          disabled={saving || loadError}
          className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? '保存中...' : '完成'}
        </button>
      </div>

      {/* Loading overlay */}
      {loading && !loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">加载图片编辑器中...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-white font-medium">图片加载失败</p>
            <p className="text-gray-400 text-sm">可能是图片地址不支持跨域访问</p>
            <button onClick={handleRetry} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
              重试
            </button>
          </div>
        </div>
      )}

      {/* Editor Container */}
      {!loadError && <div ref={containerRef} className="flex-1 relative overflow-hidden" />}
    </div>
  );
}