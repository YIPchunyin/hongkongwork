'use client';

import { useEffect, useRef, useCallback } from 'react';
import 'viewerjs/dist/viewer.css';

interface ViewerOptions {
  url?: string | string[];
  initialView?: number;
  onClose?: () => void;
  navbar?: boolean;
  title?: boolean;
  toolbar?: any;
  tooltip?: boolean;
  movable?: boolean;
  zoomable?: boolean;
  rotatable?: boolean;
  scalable?: boolean;
  transition?: boolean;
  fullscreen?: boolean;
  keyboard?: boolean;
  inline?: boolean;
  button?: boolean;
  loop?: boolean;
  zIndex?: number;
}

export default function ImageViewer({
  url,
  initialView = 0,
  onClose,
  navbar = true,
  title = false,
  toolbar = {
    zoomIn: 4,
    zoomOut: 4,
    oneToOne: 4,
    reset: 4,
    prev: 0,
    play: 0,
    next: 0,
    rotateLeft: 4,
    rotateRight: 4,
    flipHorizontal: 4,
    flipVertical: 4,
  },
  tooltip = true,
  movable = true,
  zoomable = true,
  rotatable = true,
  scalable = true,
  transition = true,
  fullscreen = true,
  keyboard = true,
  inline = false,
  button = true,
  loop = true,
  zIndex = 9999,
}: ViewerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const viewerInitialized = useRef(false);

  const initViewer = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    import('viewerjs').then((ViewerModule) => {
      const Viewer = ViewerModule.default || ViewerModule;
      if (!containerRef.current || viewerInitialized.current) return;

      viewerRef.current = new Viewer(containerRef.current, {
        url: 'data-src',
        navbar,
        title,
        toolbar,
        tooltip,
        movable,
        zoomable,
        rotatable,
        scalable,
        transition,
        fullscreen,
        keyboard,
        inline,
        button,
        loop,
        zIndex,
        viewed() {
          if (viewerRef.current) {
            viewerRef.current.zoomTo(0.8);
          }
        },
        hidden() {
          viewerRef.current?.destroy();
          viewerRef.current = null;
          viewerInitialized.current = false;
          onClose?.();
        },
      });

      viewerInitialized.current = true;
      viewerRef.current.show();
    });
  }, [navbar, title, toolbar, tooltip, movable, zoomable, rotatable, scalable, transition, fullscreen, keyboard, inline, button, loop, zIndex, onClose]);

  useEffect(() => {
    if (url) {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        viewerInitialized.current = false;
      }
      const timer = setTimeout(() => initViewer(), 100);
      return () => clearTimeout(timer);
    }
  }, [url, initViewer]);

  useEffect(() => {
    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      viewerInitialized.current = false;
    };
  }, []);

  const urls = Array.isArray(url) ? url : url ? [url] : [];

  return (
    <div ref={containerRef} style={{ display: 'none' }}>
      {urls.map((u, i) => (
        <img
          key={i}
          src={u}
          data-src={u}
          alt={'Image ' + (i + 1)}
        />
      ))}
    </div>
  );
}
