import { Suspense } from 'react';
import MtrSchedule from './MtrSchedule';

export default function MtrPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MtrSchedule />
    </Suspense>
  );
}
