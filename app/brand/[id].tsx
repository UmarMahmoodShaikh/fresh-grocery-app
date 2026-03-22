import { SafeAreaView } from "react-native-safe-area-context";
import { BasketLoader } from "@/components/BasketLoader";
import { brandsApi, productsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
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

interface Brand {
    id: number;
    name: string;
    image_url?: string;
}

export default function BrandProductsScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) load(parseInt(id, 10));
    }, [id]);

    const load = async (brandId: number) => {
        setLoading(true);
        const [prodRes, brandRes] = await Promise.all([
            productsApi.getByBrand(brandId),
            brandsApi.getById(brandId),
        ]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        if (brandRes.data) setBrand(brandRes.data as Brand);
        setLoading(false);
    };

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
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="cube-outline" size={32} color="#D1D5DB" />
                    </View>
                )}
                {item.category && (
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category.name}</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                </Text>
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

    const displayName = brand?.name ?? name ?? "Brand";

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#F9FAFB" : "#1F2937"} />
                </TouchableOpacity>
                {brand?.image_url ? (
                    <Image
                        source={{ uri: brand.image_url }}
                        style={styles.brandLogo}
                        resizeMode="contain"
                    />
                ) : null}
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
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <BasketLoader text={`Loading ${displayName} products…`} backgroundColor="transparent" />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySub}>
                        {displayName} hasn't added any products yet.
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
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },
    brandLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827" },
    headerSub: { fontSize: 13, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 2 },
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
        position: "relative",
    },
    image: { width: "100%", height: "100%" },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryBadge: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(45,106,79,0.85)",
        paddingVertical: 2,
        alignItems: "center",
    },
    categoryBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
    info: { flex: 1 },
    productName: {
        fontSize: 15,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#111827",
        marginBottom: 6,
        lineHeight: 20,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    price: { fontSize: 16, fontWeight: "800", color: "#2D6A4F" },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    stockText: { fontSize: 11, fontWeight: "600" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: isDark ? "#D1D5DB" : "#374151", marginTop: 16 },
    emptySub: { fontSize: 14, color: isDark ? "#D1D5DB" : "#9CA3AF", marginTop: 6, textAlign: "center" },
});
