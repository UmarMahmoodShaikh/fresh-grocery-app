import AsyncStorage from "@react-native-async-storage/async-storage";


// Android emulator uses 10.0.2.2, Genymotion uses 10.0.3.2, and physical devices need the LAN IP.
// Extracting it dynamically from Expo Constants fixes networking for all Android targets.
const getBaseUrl = () => {
    // Use local network IP for both emulator and physical device testing
    // return "http://10.68.249.30:3000";
    return "http://127.0.0.1:3000";
};

export const API_BASE_URL = getBaseUrl();

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const AUTH_TIMESTAMP_KEY = "auth_timestamp";

// --- Token Management ---

export const getToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
};

export const removeToken = async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = async (): Promise<any | null> => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const setStoredUser = async (user: any): Promise<void> => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isSessionValid = async (): Promise<boolean> => {
    const timestamp = await AsyncStorage.getItem(AUTH_TIMESTAMP_KEY);
    const token = await getToken();
    if (!timestamp || !token) return false;

    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    return (now - parseInt(timestamp, 10)) < oneDay;
};

export const clearAuth = async (): Promise<void> => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, AUTH_TIMESTAMP_KEY]);
};

// --- API Client ---

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiResponse<T = any> {
    data: T | null;
    error: string | null;
    status: number;
}

/**
 * 📋 DOMAIN VERSION MAP
 *
 * Single source of truth for which API version each domain uses.
 * New joiners: change the version HERE — not scattered across API calls.
 *
 * V1 = user-scoped (auth, addresses, invoices, brands — global, not store-specific)
 * V2 = store-scoped (products, cart, orders, categories — multi-tenant, Redis-backed)
 */
export const DOMAIN_VERSIONS = {
    // ── V1 Domains (User-scoped, always stable) ───────────────────────────
    auth:       "v1" as const,  // Login, signup, JWT — never store-scoped
    addresses:  "v1" as const,  // User delivery addresses
    invoices:   "v1" as const,  // Billing history
    orders:     "v1" as const,  // Order history (read). Checkout uses V2 below.
    brands:     "v1" as const,  // Global brand catalog
    users:      "v1" as const,  // User profile management

    // ── V2 Domains (Store-scoped, multi-tenant Redis architecture) ────────
    stores:     "v2" as const,  // Store discovery & tenant resolution
    products:   "v2" as const,  // Store-specific catalog with regional pricing
    categories: "v2" as const,  // Categories scoped to active store
    cart:       "v2" as const,  // Redis Hash cart (replaces Postgres carts table)
    checkout:   "v2" as const,  // Idempotent checkout with pessimistic locking
    promotions: "v2" as const,  // Store banners & time-limited promotions
} as const;

export const apiRequest = async <T = any>(
    endpoint: string,
    method: HttpMethod = "GET",
    body?: any,
    version: "v1" | "v2" = "v1"
): Promise<ApiResponse<T>> => {
    const token = await getToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const url = `${API_BASE_URL}/api/${version}${endpoint}`;
        
        // Add a 10-second timeout to prevent the 'White Screen of Death' on network stalls
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const errorMessage =
                data?.message || data?.errors?.join(", ") || data?.error || "Request failed";
            return { data: null, error: errorMessage, status: response.status };
        }

        return { data, error: null, status: response.status };
    } catch (error: any) {
        return {
            data: null,
            error: error.message || "Network error. Please check your connection.",
            status: 0,
        };
    }
};

// --- Store API (V2) ---
export const storesApi = {
    getAll: async () => {
        return apiRequest("/stores", "GET", undefined, DOMAIN_VERSIONS.stores);
    },
    getBySlug: async (slug: string) => {
        return apiRequest(`/stores/${slug}`, "GET", undefined, DOMAIN_VERSIONS.stores);
    },
    detect: async (lat: number, lng: number) => {
        return apiRequest(`/stores/detect?lat=${lat}&lng=${lng}`, "GET", undefined, DOMAIN_VERSIONS.stores);
    }
};

// --- Auth API ---

export const authApi = {
    login: async (email: string, password: string) => {
        const result = await apiRequest<{
            message: string;
            token: string;
            user: { id: number; email: string; role: string };
        }>("/auth/login", "POST", { email, password });

        if (result.data?.token) {
            await setToken(result.data.token);
            await setStoredUser(result.data.user);
        }

        return result;
    },

    signup: async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
        const result = await apiRequest<{
            message: string;
            token: string;
            user: { id: number; email: string; role: string; first_name: string; last_name: string; phone: string; formatted_phone: string };
        }>("/auth/signup", "POST", { email, password, first_name: firstName, last_name: lastName, phone });

        if (result.data?.token) {
            await setToken(result.data.token);
            await setStoredUser(result.data.user);
        }

        return result;
    },

    me: async () => {
        return apiRequest<{ id: number; email: string; role: string }>("/auth/me");
    },

    checkEmail: async (email: string) => {
        return apiRequest<{ exists: boolean; role: string }>(
            "/auth/check-email",
            "POST",
            { email }
        );
    },

    logout: async () => {
        await clearAuth();
    },
};

// --- Products API ---

export const productsApi = {
    getAll: async () => {
        const res = await apiRequest("/products");
        if (res.data?.products) res.data = res.data.products;
        return res;
    },

    getByBrand: async (brandId: number) => {
        const res = await apiRequest(`/products?brand_id=${brandId}`);
        if (res.data?.products) res.data = res.data.products;
        return res;
    },

    getByCategory: async (categoryId: number) => {
        const res = await apiRequest(`/products?category_id=${categoryId}`);
        if (res.data?.products) res.data = res.data.products;
        return res;
    },

    getById: async (id: number) => {
        return apiRequest(`/products/${id}`);
    },

    getByBarcode: async (barcode: string) => {
        const res = await apiRequest(`/products?barcode=${barcode}`);
        if (res.data?.products) res.data = res.data.products;
        return res;
    },

    create: async (productData: any) => {
        return apiRequest("/products", "POST", { product: productData });
    },

    update: async (id: number, productData: any) => {
        return apiRequest(`/products/${id}`, "PATCH", { product: productData });
    },

    delete: async (id: number) => {
        return apiRequest(`/products/${id}`, "DELETE");
    },
};

// --- Products API (V2) ---
export const productsApiV2 = {
    getAll: async (storeSlug: string) => {
        return apiRequest(`/stores/${storeSlug}/products`, "GET", undefined, DOMAIN_VERSIONS.products);
    },
    getById: async (storeSlug: string, id: number) => {
        return apiRequest(`/stores/${storeSlug}/products/${id}`, "GET", undefined, DOMAIN_VERSIONS.products);
    },
    getByCategory: async (storeSlug: string, categoryId: number) => {
        return apiRequest(`/stores/${storeSlug}/products?category_id=${categoryId}`, "GET", undefined, DOMAIN_VERSIONS.products);
    },
    getByBarcode: async (storeSlug: string, barcode: string) => {
        const res = await apiRequest(`/stores/${storeSlug}/products?barcode=${barcode}`, "GET", undefined, DOMAIN_VERSIONS.products);
        if (res.data && Array.isArray(res.data)) {
            // The service returns an array for index calls, but scanner expects single item or null
            return { ...res, data: res.data[0] || null };
        }
        return res;
    }
};

// --- Categories API ---

export const categoriesApi = {
    getAll: async () => {
        return apiRequest("/categories");
    },

    getById: async (id: number) => {
        return apiRequest(`/categories/${id}`);
    },
};

// --- Categories API (V2) ---
export const categoriesApiV2 = {
    getAll: async (storeSlug: string) => {
        return apiRequest(`/stores/${storeSlug}/categories`, "GET", undefined, DOMAIN_VERSIONS.categories);
    }
};

// --- Brands API ---

export const brandsApi = {
    getAll: async () => {
        return apiRequest("/brands");
    },

    getById: async (id: number) => {
        return apiRequest(`/brands/${id}`);
    },
};

// --- Cart API (V2 - Redis) ---
export const cartApi = {
    get: async (storeSlug: string) => {
        return apiRequest(`/stores/${storeSlug}/cart`, "GET", undefined, DOMAIN_VERSIONS.cart);
    },
    addItem: async (storeSlug: string, productId: number, quantity: number) => {
        return apiRequest(`/stores/${storeSlug}/cart/add_item`, "POST", { product_id: productId, quantity }, DOMAIN_VERSIONS.cart);
    },
    removeItem: async (storeSlug: string, productId: number) => {
        return apiRequest(`/stores/${storeSlug}/cart/items/${productId}`, "DELETE", undefined, DOMAIN_VERSIONS.cart);
    },
    clear: async (storeSlug: string) => {
        return apiRequest(`/stores/${storeSlug}/cart`, "DELETE", undefined, DOMAIN_VERSIONS.cart);
    }
};

// --- Orders API ---

export const ordersApi = {
    getAll: async () => {
        return apiRequest("/orders");
    },

    getById: async (id: number) => {
        return apiRequest(`/orders/${id}`);
    },

    create: async (orderData: {
        order: { total: number; delivery_address?: string; delivery_fee?: number };
        items: Array<{ product_id: number; quantity: number; price: number }>;
    }) => {
        return apiRequest("/orders", "POST", orderData);
    },

    updateStatus: async (id: number, status: string) => {
        return apiRequest(`/orders/${id}/update_status`, "PATCH", { status });
    },

    update: async (id: number, orderData: { score?: number; comments?: string; status?: string }) => {
        return apiRequest(`/orders/${id}`, "PATCH", { order: orderData });
    },
};

// --- Orders API (V2) ---
export const ordersApiV2 = {
    checkout: async (storeSlug: string, checkoutData: {
        address_id: number;
        payment_method?: string;
        idempotency_key: string;
    }) => {
        return apiRequest(`/stores/${storeSlug}/orders/checkout`, "POST", checkoutData, DOMAIN_VERSIONS.checkout);
    }
};

// --- Invoices API ---

export const invoicesApi = {
    getAll: async (params?: { offset?: number; limit?: number; order_id?: string }) => {
        let url = "/invoices?";
        if (params?.offset !== undefined) url += `offset=${params.offset}&`;
        if (params?.limit !== undefined) url += `limit=${params.limit}&`;
        if (params?.order_id) url += `order_id=${params.order_id}`;
        return apiRequest(url);
    },

    getById: async (id: number) => {
        return apiRequest(`/invoices/${id}`);
    },

    update: async (id: number, invoiceData: any) => {
        return apiRequest(`/invoices/${id}`, "PATCH", { invoice: invoiceData });
    },
};

// --- Addresses API ---

export const addressesApi = {
    getAll: async () => {
        return apiRequest("/addresses");
    },

    create: async (address: {
        label: string;
        street: string;
        city: string;
        zip_code: string;
        country: string;
        latitude: number;
        longitude: number;
        is_default?: boolean;
    }) => {
        return apiRequest("/addresses", "POST", { address });
    },

    update: async (id: number, address: {
        label?: string;
        street?: string;
        city?: string;
        zip_code?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
        is_default?: boolean;
    }) => {
        return apiRequest(`/addresses/${id}`, "PATCH", { address });
    },

    delete: async (id: number) => {
        return apiRequest(`/addresses/${id}`, "DELETE");
    },

    setDefault: async (id: number) => {
        return apiRequest(`/addresses/${id}/set_default`, "PATCH");
    },
};

