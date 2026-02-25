import AsyncStorage from "@react-native-async-storage/async-storage";


// Android emulator uses 10.0.2.2, Genymotion uses 10.0.3.2, and physical devices need the LAN IP.
// Extracting it dynamically from Expo Constants fixes networking for all Android targets.
const getBaseUrl = () => {
    // Force Heroku URL for production/remote testing
    return "https://fresh-grocery-store-74f6cf859e50.herokuapp.com";
};

export const API_BASE_URL = getBaseUrl();

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// --- Token Management ---

export const getToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
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

export const clearAuth = async (): Promise<void> => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};

// --- API Client ---

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiResponse<T = any> {
    data: T | null;
    error: string | null;
    status: number;
}

export const apiRequest = async <T = any>(
    endpoint: string,
    method: HttpMethod = "GET",
    body?: any
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
        const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

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
        return apiRequest("/products");
    },

    getByBrand: async (brandId: number) => {
        return apiRequest(`/products?brand_id=${brandId}`);
    },

    getByCategory: async (categoryId: number) => {
        return apiRequest(`/products?category_id=${categoryId}`);
    },

    getById: async (id: number) => {
        return apiRequest(`/products/${id}`);
    },

    getByBarcode: async (barcode: string) => {
        return apiRequest(`/products?barcode=${barcode}`);
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

// --- Categories API ---

export const categoriesApi = {
    getAll: async () => {
        return apiRequest("/categories");
    },

    getById: async (id: number) => {
        return apiRequest(`/categories/${id}`);
    },
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

