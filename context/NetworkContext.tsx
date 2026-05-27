import NetInfoPlugin from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkContextType {
    isOnline: boolean;
    isConnecting: boolean;
    connectionType: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionType, setConnectionType] = useState('unknown');
    const [appState, setAppState] = useState<AppStateStatus>('active');

    // Monitor network state changes
    useEffect(() => {
        const unsubscribe = NetInfoPlugin.addEventListener(state => {
            const online = state.isConnected ?? true;
            const type = state.type ?? 'unknown';
            
            setIsOnline(online);
            setConnectionType(type);
            setIsConnecting(state.isInternetReachable === undefined ? false : !state.isInternetReachable);
        });

        // Check initial network state
        NetInfoPlugin.fetch().then(state => {
            setIsOnline(state.isConnected ?? true);
            setConnectionType(state.type ?? 'unknown');
        });

        return () => unsubscribe();
    }, []);

    // Monitor app state (foreground/background)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
        setAppState(nextAppState);

        // Recheck network when app comes to foreground
        if (nextAppState === 'active') {
            const state = await NetInfoPlugin.fetch();
            setIsOnline(state.isConnected ?? true);
            setConnectionType(state.type ?? 'unknown');
        }
    };

    return (
        <NetworkContext.Provider
            value={{
                isOnline,
                isConnecting,
                connectionType,
            }}
        >
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
