'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';

interface ImageEditorModalProps {
  imageUrl: string;
  onSave: (editedDataUrl: string) => void;
  onClose: () => void;
}

type EditMode = 'none' | 'crop' | 'draw' | 'text';

export default function ImageEditorModal({ imageUrl, onSave, onClose }: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const imageRef = useRef<fabric.FabricImage | null>(null);
  const [mode, setMode] = useState<EditMode>('none');
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [drawSize, setDrawSize] = useState(3);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cropRect, setCropRect] = useState<fabric.Rect | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const cropStartRef = useRef<{x:number,y:number} | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ w: rect.width, h: rect.height });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerSize.w,
      height: containerSize.h,
      backgroundColor: '#1a1a2e',
      selection: false,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;
    
    loadImage(canvas);
    
    return () => {
      ro.disconnect();
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update canvas size when container changes
  useEffect(() => {
    if (fabricRef.current && containerSize.w > 0 && containerSize.h > 0) {
      fabricRef.current.setDimensions({ width: containerSize.w, height: containerSize.h });
      centerImage();
    }
  }, [containerSize]);

  const loadImage = async (canvas: fabric.Canvas) => {
    setLoading(true);
    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      imageRef.current = img;
      img.set({ selectable: false, evented: false });
      centerImage();
      canvas.add(img);
      canvas.renderAll();
    } catch (err) {
      console.error('Image load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const centerImage = () => {
    const canvas = fabricRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const cw = canvas.getWidth(), ch = canvas.getHeight();
    if (cw === 0 || ch === 0) return;
    const scale = Math.min((cw - 40) / img.width!, (ch - 40) / img.height!, 1);
    img.set({ scaleX: scale, scaleY: scale, left: (cw - img.width! * scale) / 2, top: (ch - img.height! * scale) / 2 });
    canvas.renderAll();
  };

  // Enable drawing mode
  const enableDraw = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    resetModes();
    setMode('draw');
    canvas.isDrawingMode = true;
    const brush = new fabric.PencilBrush(canvas);
    brush.color = drawColor;
    brush.width = drawSize;
    canvas.freeDrawingBrush = brush;
    canvas.selection = false;
  };

  // Enable crop mode
  const enableCrop = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    resetModes();
    setMode('crop');
    canvas.isDrawingMode = false;
    canvas.selection = true;
    setIsCropping(false);
  };

  // Add text
  const enableText = () => {
    setShowTextInput(true);
    setMode('text');
    const canvas = fabricRef.current;
    if (canvas) { canvas.isDrawingMode = false; canvas.selection = false; }
  };

  const addText = () => {
    if (!textInput.trim()) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.FabricText(textInput.trim(), {
      left: canvas.getWidth() / 2 - 50,
      top: canvas.getHeight() / 2 - 10,
      fontSize: 28,
      fill: drawColor,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      selectable: true,
      evented: true,
      hasControls: true,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTextInput('');
    setShowTextInput(false);
    setMode('none');
  };

  // Rotate
  const handleRotate = () => {
    const canvas = fabricRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const newAngle = (rotation + 90) % 360;
    setRotation(newAngle);
    img.rotate(newAngle);
    // Re-center after rotation
    const cw = canvas.getWidth(), ch = canvas.getHeight();
    const bounds = img.getBoundingRect();
    img.set({ left: (cw - bounds.width) / 2, top: (ch - bounds.height) / 2 });
    canvas.renderAll();
  };

  const resetModes = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = false;
    canvas.selection = false;
    setMode('none');
    // Remove crop rect
    if (cropRect) {
      canvas.remove(cropRect);
      setCropRect(null);
    }
    setIsCropping(false);
    cropStartRef.current = null;
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // Apply crop
  const applyCrop = () => {
    const canvas = fabricRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !cropRect) return;
    
    const rect = cropRect;
    const imgBounds = img.getBoundingRect();
    const scaleX = img.width! / imgBounds.width;
    const scaleY = img.height! / imgBounds.height;
    
    // Calculate crop area relative to image original dimensions
    const cropX = (rect.left! - imgBounds.left) * scaleX;
    const cropY = (rect.top! - imgBounds.top) * scaleY;
    const cropW = rect.width! * scaleX;
    const cropH = rect.height! * scaleY;
    
    // Create a temporary canvas for the crop
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const ctx = tempCanvas.getContext('2d')!;
    
    const imgEl = img.getElement();
    ctx.drawImage(imgEl, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    
    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    
    // Reload the cropped image
    canvas.remove(rect);
    setCropRect(null);
    canvas.remove(img);
    
    fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' }).then(newImg => {
      imageRef.current = newImg;
      newImg.set({ selectable: false, evented: false });
      centerImage();
      canvas.add(newImg);
      canvas.renderAll();
    });
  };

  // Handle mouse events for crop
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || mode !== 'crop') return;
    
    const onMouseDown = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (mode !== 'crop') return;
      const pointer = canvas.getScenePoint(opt.e as MouseEvent);
      setIsCropping(true);
      cropStartRef.current = { x: pointer.x, y: pointer.y };
      
      if (cropRect) { canvas.remove(cropRect); setCropRect(null); }
      
      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 0,
        height: 0,
        fill: 'rgba(59,130,246,0.15)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        strokeDashArray: [6, 3],
        selectable: false,
        evented: false,
      });
      canvas.add(rect);
      setCropRect(rect);
    };
    
    const onMouseMove = (opt: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (!isCropping || !cropStartRef.current || !cropRect) return;
      const pointer = canvas.getScenePoint(opt.e as MouseEvent);
      const x = Math.min(cropStartRef.current.x, pointer.x);
      const y = Math.min(cropStartRef.current.y, pointer.y);
      const w = Math.abs(pointer.x - cropStartRef.current.x);
      const h = Math.abs(pointer.y - cropStartRef.current.y);
      cropRect.set({ left: x, top: y, width: w, height: h });
      canvas.renderAll();
    };
    
    const onMouseUp = () => {
      setIsCropping(false);
      cropStartRef.current = null;
    };
    
    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    
    return () => {
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
    };
  }, [mode, isCropping, cropRect]);

  // Save
  const handleSave = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Remove crop rect if exists
    if (cropRect) { canvas.remove(cropRect); setCropRect(null); }
    
    // Set image as non-interactive for rendering
    const img = imageRef.current;
    if (img) {
      img.set({ selectable: false, evented: false });
    }
    // Make text objects non-interactive temporarily
    canvas.getObjects().forEach(obj => {
      if (obj !== img) {
        obj.set({ selectable: false, evented: false });
      }
    });
    canvas.renderAll();
    
    // Wait a tick for render
    await new Promise(r => setTimeout(r, 50));
    
    const dataUrl = canvas.toDataURL({ multiplier: 1, format: 'jpeg', quality: 0.95 });
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white font-medium text-sm">图片编辑</span>
        <button onClick={handleSave} className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
          完成
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0 overflow-x-auto">
        <button
          onClick={() => { resetModes(); centerImage(); }}
          className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ' + (mode === 'none' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          ✋ 选择
        </button>
        <button
          onClick={enableCrop}
          className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ' + (mode === 'crop' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          ✂️ 裁剪
        </button>
        <button
          onClick={enableDraw}
          className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ' + (mode === 'draw' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          🖊️ 画笔
        </button>
        <button
          onClick={enableText}
          className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ' + (mode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700')}
        >
          T 文本
        </button>
        <button
          onClick={handleRotate}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-gray-800 text-gray-300 hover:bg-gray-700"
        >
          🔄 旋转
        </button>
      </div>

      {/* Draw options */}
      {mode === 'draw' && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-gray-800 shrink-0">
          <input type="color" value={drawColor} onChange={e => {
            setDrawColor(e.target.value);
            const brush = fabricRef.current?.freeDrawingBrush as fabric.PencilBrush;
            if (brush) brush.color = e.target.value;
          }} className="w-8 h-8 rounded cursor-pointer border-0" />
          <input type="range" min={1} max={20} value={drawSize} onChange={e => {
            const v = parseInt(e.target.value);
            setDrawSize(v);
            const brush = fabricRef.current?.freeDrawingBrush as fabric.PencilBrush;
            if (brush) brush.width = v;
          }} className="w-24 accent-blue-500" />
          <span className="text-gray-400 text-xs">{drawSize}px</span>
        </div>
      )}

      {/* Crop actions */}
      {mode === 'crop' && cropRect && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 shrink-0">
          <button onClick={applyCrop} className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
            ✅ 应用裁剪
          </button>
          <button onClick={() => { if (cropRect && fabricRef.current) { fabricRef.current.remove(cropRect); setCropRect(null); } }} className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors">
            取消
          </button>
        </div>
      )}

      {/* Text input popup */}
      {showTextInput && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-xl p-4 shadow-2xl border border-gray-700 min-w-[250px]">
          <p className="text-white text-xs mb-2">输入文本内容</p>
          <input
            type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="输入文字..." className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 mb-3"
            onKeyDown={e => { if (e.key === 'Enter') addText(); }}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={addText} className="flex-1 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600">添加</button>
            <button onClick={() => { setShowTextInput(false); setMode('none'); }} className="flex-1 py-1.5 bg-gray-700 text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-600">取消</button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-[3px] border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
}
