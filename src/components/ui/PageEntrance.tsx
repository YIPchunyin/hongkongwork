'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PageEntranceProps {
  children: React.ReactNode;
  duration?: number;
}

export default function PageEntrance({ children, duration = 1.2 }: PageEntranceProps) {
  const [showContent, setShowContent] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), duration * 0.6 * 1000);
    const t2 = setTimeout(() => setAnimDone(true), duration * 1000 + 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration]);

  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {!animDone && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600"
              initial={{ width: 0, height: 0, opacity: 0.9 }}
              animate={{
                width: showContent ? '300vw' : '40vw',
                height: showContent ? '300vw' : '40vw',
                opacity: showContent ? 0 : 0.9,
              }}
              transition={{
                duration: duration * 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1,
              }}
              style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
            />
            <motion.div
              className="absolute w-4 h-4 bg-white rounded-full z-10"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.5, 0], opacity: [1, 0.8, 0] }}
              transition={{ duration: 0.8, repeat: showContent ? 0 : 2, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: animDone ? 1 : 0, y: animDone ? 0 : 20 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
