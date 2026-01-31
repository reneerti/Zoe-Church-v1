import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { cn } from '@/lib/utils';

export const NetworkStatus: React.FC = () => {
    const { isOnline, connectionQuality } = useNetwork();
    const [showStatus, setShowStatus] = useState(true);

    useEffect(() => {
        // Auto-hide after 5 seconds if online with good connection
        if (isOnline && connectionQuality === 'good') {
            const timer = setTimeout(() => setShowStatus(false), 5000);
            return () => clearTimeout(timer);
        } else {
            setShowStatus(true);
        }
    }, [isOnline, connectionQuality]);

    if (!showStatus && isOnline && connectionQuality === 'good') {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all',
                isOnline
                    ? connectionQuality === 'good'
                        ? 'bg-green-500 text-white'
                        : 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
            )}
        >
            {isOnline ? (
                connectionQuality === 'good' ? (
                    <>
                        <Wifi className="h-4 w-4" />
                        <span>Online</span>
                    </>
                ) : (
                    <>
                        <Signal className="h-4 w-4" />
                        <span>Conexão Lenta</span>
                    </>
                )
            ) : (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span>Modo Offline</span>
                </>
            )}
        </div>
    );
};
