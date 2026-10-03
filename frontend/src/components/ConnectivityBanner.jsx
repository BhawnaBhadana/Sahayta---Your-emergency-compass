import { useTranslation } from 'react-i18next';
import { useRealtime } from '../context/RealtimeContext';
import { timeAgo } from '../utils/format';

export default function ConnectivityBanner() {
  const { isOnline, lastSyncedAt } = useRealtime();
  const { t } = useTranslation();
  if (isOnline) return null;

  return (
    <div className="border-b border-yellow-300 bg-yellow-50 px-4 py-2 text-center text-sm text-yellow-800" role="status">
      <strong>⚠ {t('common.offline')}.</strong> {t('connectivity.banner', { time: timeAgo(lastSyncedAt) })}{' '}
      {t('connectivity.bannerNote')}
    </div>
  );
}
