import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { offlineStorageService } from '../../services/offlineStorageService.js';
import { useTranslation } from '../../context/LanguageContext.js';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(offlineStorageService.isOnline());
  const [isSimulated, setIsSimulated] = useState<boolean>(offlineStorageService.isSimulated());
  const [lastSync, setLastSync] = useState<string | null>(offlineStorageService.getLastSyncTimestamp());

  useEffect(() => {
    const unsubscribe = offlineStorageService.subscribe((online) => {
      setIsOnline(online);
      setIsSimulated(offlineStorageService.isSimulated());
      setLastSync(offlineStorageService.getLastSyncTimestamp());
    });
    return () => unsubscribe();
  }, []);

  const toggleSimulated = () => {
    if (isSimulated) {
      offlineStorageService.setSimulatedOffline(false);
    } else {
      offlineStorageService.setSimulatedOffline(true);
    }
  };

  if (isOnline && !isSimulated) {
    return null;
  }

  return (
    <div className="bg-amber-600/90 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md backdrop-blur-sm sticky top-16 z-40 transition-all">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-slate-950 animate-bounce" />
        <span>
          {t('status.offline')} &bull;{' '}
          {lastSync
            ? `${t('train.lastUpdated')}: ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Using cached railway database'}
        </span>
        {isSimulated && (
          <span className="bg-amber-900/30 text-amber-950 text-[10px] px-1.5 py-0.5 rounded border border-amber-950/20 font-bold uppercase">
            Simulated
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleSimulated}
          className="bg-slate-950 text-amber-300 hover:bg-slate-900 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition"
        >
          {isSimulated ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>Go Online</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3" />
              <span>Retry Connection</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
