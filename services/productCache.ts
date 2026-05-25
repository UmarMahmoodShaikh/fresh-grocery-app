import AsyncStorage from "@react-native-async-storage/async-storage";
import { productsApiV2 } from "./api";

const CACHE_KEY_PREFIX = "offline_products_";
const CACHE_TIME_KEY_PREFIX = "offline_products_time_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedProduct {
  id: number;
  name: string;
  barcode: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  nutrition?: any;
  category_id?: number;
}

export const productCacheService = {
  getStoreCacheKey: (storeSlug: string) => `${CACHE_KEY_PREFIX}${storeSlug}`,
  getStoreTimeKey: (storeSlug: string) => `${CACHE_TIME_KEY_PREFIX}${storeSlug}`,

  prefetchStoreProducts: async (storeSlug: string, force = false): Promise<void> => {
    if (!storeSlug) return;

    try {
      if (!force) {
        const lastFetchStr = await AsyncStorage.getItem(productCacheService.getStoreTimeKey(storeSlug));
        if (lastFetchStr) {
          const lastFetch = parseInt(lastFetchStr, 10);
          if (Date.now() - lastFetch < CACHE_EXPIRY_MS) {
            // Cache is still valid
            return;
          }
        }
      }

      // Fetch all products for the store
      const res = await productsApiV2.getAll(storeSlug);
      
      if (res.data && Array.isArray(res.data)) {
        // Map to essential fields to save storage space
        const essentialProducts: CachedProduct[] = res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          price: Number(p.price) || 0,
          discount_price: p.discount_price ? Number(p.discount_price) : undefined,
          image_url: p.image_url,
          nutrition: p.nutrition,
          category_id: p.category_id
        }));

        await AsyncStorage.setItem(productCacheService.getStoreCacheKey(storeSlug), JSON.stringify(essentialProducts));
        await AsyncStorage.setItem(productCacheService.getStoreTimeKey(storeSlug), Date.now().toString());
      }
    } catch (e) {
      console.error("Failed to prefetch store products", e);
    }
  },

  getAllCachedProducts: async (storeSlug: string): Promise<CachedProduct[]> => {
    try {
      const stored = await AsyncStorage.getItem(productCacheService.getStoreCacheKey(storeSlug));
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to read product cache", e);
      return [];
    }
  },

  getCachedProductByBarcode: async (storeSlug: string, barcode: string): Promise<CachedProduct | null> => {
    const products = await productCacheService.getAllCachedProducts(storeSlug);
    return products.find(p => p.barcode === barcode) || null;
  },

  getCachedProductById: async (storeSlug: string, id: number): Promise<CachedProduct | null> => {
    const products = await productCacheService.getAllCachedProducts(storeSlug);
    return products.find(p => p.id === id) || null;
  }
};
