import React, { createContext, useContext, useEffect, useState } from 'react';
import { networkMonitor } from '@/lib/supabaseOfflineClient';

interface NetworkContextType {
    isOnline: boolean;
    connectionQuality: 'good' | 'poor' | 'offline';
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(networkMonitor.isOnline);
    const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

    useEffect(() => {
        // Listen to network status changes
        const unsubscribe = networkMonitor.addListener((online) => {
            setIsOnline(online);
            setConnectionQuality(online ? 'good' : 'offline');
        });

        // Check connection quality periodically when online
        const checkConnectionQuality = async () => {
            if (!navigator.onLine) {
                setConnectionQuality('offline');
                return;
            }

            try {
                const start = Date.now();
                const response = await fetch('https://www.google.com/favicon.ico', {
                    mode: 'no-cors',
                    cache: 'no-cache',
                });
                const duration = Date.now() - start;

                if (duration < 1000) {
                    setConnectionQuality('good');
                } else if (duration < 3000) {
                    setConnectionQuality('poor');
                } else {
                    setConnectionQuality('poor');
                }
            } catch {
                setConnectionQuality('offline');
            }
        };

        // Check quality every 30 seconds when online
        const intervalId = setInterval(() => {
            if (isOnline) {
                checkConnectionQuality();
            }
        }, 30000);

        // Initial check
        checkConnectionQuality();

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [isOnline]);

    return (
        <NetworkContext.Provider value={{ isOnline, connectionQuality }}>
            {children}
        </NetworkContext.Provider>
    );
};
