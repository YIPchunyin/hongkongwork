'use client';
import { useRef, useState, useEffect } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
  loadingText?: string;
}

export default function LazyLoad({ children, loadingText = '📊 滚动到此处自动加载图表...' }: LazyLoadProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ref.current || done) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        setDone(true);
        obs.disconnect();
      }
    }, { threshold: 0.1, rootMargin: '100px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [done]);

  return (
    <div ref={ref}>
      {!visible ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-400">{loadingText}</span>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
