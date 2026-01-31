import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SyncService, type SyncStatus } from '@/services/syncService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const SyncIndicator: React.FC = () => {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [showIndicator, setShowIndicator] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        // Listen to sync status changes
        const unsubscribe = SyncService.addListener((status, count) => {
            setSyncStatus(status);
            setPendingCount(count);
            setShowIndicator(status !== 'idle' || count > 0);
        });

        // Get initial status
        SyncService.getStatus().then(({ status, pendingCount: count }) => {
            setSyncStatus(status);
            setPendingCount(count);
            setShowIndicator(status !== 'idle' || count > 0);
        });

        return unsubscribe;
    }, [user?.id]);

    const handleManualSync = () => {
        if (user?.id) {
            SyncService.manualSync(user.id);
        }
    };

    if (!showIndicator) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all',
                syncStatus === 'syncing'
                    ? 'bg-blue-500 text-white'
                    : syncStatus === 'success'
                        ? 'bg-green-500 text-white'
                        : syncStatus === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-700 text-white'
            )}
        >
            {syncStatus === 'syncing' ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sincronizando...</span>
                </>
            ) : syncStatus === 'success' ? (
                <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Sincronizado ✓</span>
                </>
            ) : syncStatus === 'error' ? (
                <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Erro na sincronização</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-white hover:bg-white/20"
                        onClick={handleManualSync}
                    >
                        Tentar novamente
                    </Button>
                </>
            ) : pendingCount > 0 ? (
                <>
                    <RefreshCw className="h-4 w-4" />
                    <span>
                        {pendingCount} {pendingCount === 1 ? 'alteração pendente' : 'alterações pendentes'}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-white hover:bg-white/20"
                        onClick={handleManualSync}
                    >
                        Sincronizar
                    </Button>
                </>
            ) : null}
        </div>
    );
};
