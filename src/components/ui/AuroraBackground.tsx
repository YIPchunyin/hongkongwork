'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showAurora?: boolean;
}

export default function AuroraBackground({ children, className, showAurora = true }: AuroraBackgroundProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {showAurora && (
        <motion.div
          className="pointer-events-none absolute -inset-[10px] opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute top-[-40%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-r from-green-300/20 via-emerald-400/15 to-teal-300/20 blur-3xl animate-aurora" />
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-l from-blue-300/20 via-cyan-400/15 to-purple-300/10 blur-3xl animate-aurora" style={{ animationDelay: '-3s' }} />
          <div className="absolute bottom-[-30%] left-[10%] w-[70%] h-[50%] rounded-full bg-gradient-to-t from-indigo-300/15 via-violet-400/10 to-pink-300/10 blur-3xl animate-aurora" style={{ animationDelay: '-6s' }} />
        </motion.div>
      )}
      {children}
    </div>
  );
}
