import { useContext } from 'react';
import { RealTimeSyncContext } from '@/components/finance/RealTimeSyncProvider';

export const useRealTimeSync = () => {
  const context = useContext(RealTimeSyncContext);
  if (!context) {
    throw new Error('useRealTimeSync must be used within RealTimeSyncProvider');
  }
  return context;
};