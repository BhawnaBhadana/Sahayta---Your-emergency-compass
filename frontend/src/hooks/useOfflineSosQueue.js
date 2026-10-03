import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as sosService from '../services/sosService';
import { readQueue, removeFromQueue, enqueueSos } from '../utils/offlineQueue';
import { useToast } from '../context/ToastContext';

/**
 * Section 12 (offline-first SOS): if a submission can't reach the server, it's
 * saved locally and clearly marked as NOT yet delivered — never silently
 * treated as sent. When connectivity returns, queued reports are retried
 * automatically against the real API.
 */
export function useOfflineSosQueue() {
  const [pending, setPending] = useState(() => readQueue().length);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced
  const toast = useToast();
  const { t } = useTranslation();

  const flush = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;
    setSyncStatus('syncing');
    let syncedCount = 0;
    for (const entry of queue) {
      try {
        await sosService.createSos(entry.payload);
        removeFromQueue(entry.id);
        syncedCount += 1;
      } catch {
        // still offline or server rejected — leave it queued, try again next time
        break;
      }
    }
    setPending(readQueue().length);
    if (syncedCount > 0) {
      setSyncStatus('synced');
      toast.success(`${syncedCount} saved SOS report${syncedCount > 1 ? 's' : ''} sent now that you're back online.`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('idle');
    }
  }, [toast, t]);

  useEffect(() => {
    window.addEventListener('online', flush);
    if (navigator.onLine) flush();
    return () => window.removeEventListener('online', flush);
  }, [flush]);

  const queueOffline = useCallback((payload) => {
    enqueueSos(payload);
    setPending(readQueue().length);
  }, []);

  return { pending, syncStatus, queueOffline, flush };
}
