import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { storesApi } from '../services/api';

export interface Store {
    id: number;
    name: string;
    slug: string;
    logo_url?: string;
    active: boolean;
    delivery_fee: number;
    min_order_amount: number;
    latitude?: number;
    longitude?: number;
}

interface StoreContextType {
    selectedStore: Store | null;
    selectStore: (store: Store) => Promise<void>;
    isLoadingStores: boolean;
    availableStores: Store[];
    refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORE_KEY = 'selected_store_slug';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);
    const [availableStores, setAvailableStores] = useState<Store[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(true);

    const loadInitialStore = async (stores: Store[]) => {
        try {
            const savedSlug = await AsyncStorage.getItem(STORE_KEY);
            if (savedSlug) {
                const store = stores.find(s => s.slug === savedSlug);
                if (store) {
                    setSelectedStore(store);
                }
            }
        } catch (error) {
            console.error('Failed to load initial store', error);
        }
    };

    const refreshStores = async () => {
        setIsLoadingStores(true);
        try {
            const result = await storesApi.getAll();
            if (result.data) {
                const stores = result.data as Store[];
                setAvailableStores(stores);
                
                // If we don't have a selection yet, or if current selection is no longer available/active
                if (!selectedStore || !stores.find(s => s.slug === selectedStore.slug && s.active)) {
                    await loadInitialStore(stores);
                }
            }
        } catch (error) {
            console.error('Failed to refresh stores', error);
        } finally {
            setIsLoadingStores(false);
        }
    };

    useEffect(() => {
        refreshStores();
    }, []);

    const selectStore = async (store: Store) => {
        setSelectedStore(store);
        await AsyncStorage.setItem(STORE_KEY, store.slug);
    };

    return (
        <StoreContext.Provider
            value={{
                selectedStore,
                selectStore,
                isLoadingStores,
                availableStores,
                refreshStores
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
