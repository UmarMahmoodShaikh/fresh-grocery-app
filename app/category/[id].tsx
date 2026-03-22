import { SafeAreaView } from "react-native-safe-area-context";
import { BasketLoader } from "@/components/BasketLoader";
import { categoriesApi, productsApi } from "@/services/api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
    useColorScheme
} from "react-native";


interface Product {
    id: number;
    name: string;
    price: number;
    stock: number;
    stock_label?: string;
    image_url?: string;
    category?: { id: number; name: string };
    brand?: { id: number; name: string };
}

interface Category {
    id: number;
    name: string;
    image_url?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
    fruits: "fruit-watermelon",
    vegetables: "fruit-watermelon",
    dairy: "cheese",
    bakery: "baguette",
    meat: "food-steak",
    beverages: "cup-water",
    snacks: "cookie",
    frozen: "snowflake",
    pantry: "archive",
    household: "spray-bottle",
};

const getCategoryIcon = (name: string): string | null => {
    const lowerName = name?.toLowerCase() || "";
    for (const [key, iconName] of Object.entries(CATEGORY_ICONS)) {
        if (lowerName.includes(key)) {
            return iconName;
        }
    }
    return null;
};

const CATEGORY_COLORS: Record<string, string> = {
    fruits: "#D1FAE5",
    vegetables: "#D1FAE5",
    dairy: "#DBEAFE",
    bakery: "#FEF3C7",
    beverages: "#E0E7FF",
    snacks: "#FCE7F3",
    meat: "#FEE2E2",
    seafood: "#CFFAFE",
    frozen: "#E0E7FF",
    pantry: "#FEF9C3",
};

export default function CategoryProductsScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) load(parseInt(id, 10));
    }, [id]);

    const load = async (catId: number) => {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
            productsApi.getByCategory(catId),
            categoriesApi.getById(catId),
        ]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        if (catRes.data) setCategory(catRes.data as Category);
        setLoading(false);
    };

    const displayName = category?.name ?? name ?? "Category";
    
    // Better lookup to handle compound names like "Fruits & Vegetables"
    const getAccentColor = (catName: string): string => {
        const lower = catName.toLowerCase();
        for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
            if (lower.includes(key)) return color;
        }
        return "#F3F4F6";
    };
    
    const accentColor = getAccentColor(displayName);

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/product/${item.id}` as any)}
            activeOpacity={0.75}
        >
            <View style={styles.imageWrap}>
                {item.image_url ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: accentColor }]}>
                        <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                </Text>
                {item.brand && (
                    <Text style={styles.brandName}>{item.brand.name}</Text>
                )}
                <View style={styles.row}>
                    <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
                    <View
                        style={[
                            styles.stockBadge,
                            { backgroundColor: item.stock > 0 ? "#D1FAE5" : "#FEE2E2" },
                        ]}
                    >
                        <Text
                            style={[
                                styles.stockText,
                                { color: item.stock > 0 ? "#065F46" : "#991B1B" },
                            ]}
                        >
                            {item.stock_label || (item.stock > 0 ? "In Stock" : "Out")}
                        </Text>
                    </View>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: accentColor }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>

                {getCategoryIcon(displayName) ? (
                    <View style={styles.categoryIconPlaceholder}>
                        <MaterialCommunityIcons 
                            name={getCategoryIcon(displayName) as any} 
                            size={22} 
                            color="#1F2937" 
                        />
                    </View>
                ) : category?.image_url ? (
                    <Image
                        source={{ uri: category.image_url }}
                        style={styles.categoryIcon}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.categoryIconPlaceholder}>
                        <Ionicons name="grid-outline" size={22} color="#4B5563" />
                    </View>
                )}

                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{displayName}</Text>
                    {!loading && (
                        <Text style={styles.headerSub}>
                            {products.length} product{products.length !== 1 ? "s" : ""}
                        </Text>
                    )}
                </View>
            </View>

            {loading ? (
                <BasketLoader text={`Loading ${displayName}…`} />
            ) : products.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="basket-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySub}>
                        Nothing in {displayName} yet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                />
            )}
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.06)",
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    categoryIconPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.7)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
    headerSub: { fontSize: 13, color: "#4B5563", marginTop: 2 },
    list: { padding: 16, paddingBottom: 40 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        padding: 12,
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        gap: 12,
    },
    imageWrap: {
        width: 72,
        height: 72,
        borderRadius: 12,
        overflow: "hidden",
    },
    image: { width: "100%", height: "100%" },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    info: { flex: 1 },
    productName: {
        fontSize: 15,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#111827",
        marginBottom: 3,
        lineHeight: 20,
    },
    brandName: {
        fontSize: 12,
        color: isDark ? "#9CA3AF" : "#6B7280",
        marginBottom: 6,
        fontWeight: "500",
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    price: { fontSize: 16, fontWeight: "800", color: "#2D6A4F" },
    stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    stockText: { fontSize: 11, fontWeight: "600" },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: isDark ? "#D1D5DB" : "#374151",
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: isDark ? "#D1D5DB" : "#9CA3AF",
        marginTop: 6,
        textAlign: "center",
    },
});
