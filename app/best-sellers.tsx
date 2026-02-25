import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { productsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FloatingPlusOne = ({ x, y }: { x: number; y: number }) => {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -40,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, [translateY, opacity]);

    return (
        <Animated.View
            style={{
                position: "absolute",
                top: y - 20,
                left: x - 15,
                transform: [{ translateY }],
                opacity,
                zIndex: 9999,
                pointerEvents: "none",
            }}
        >
            <Text style={{ color: "#2D6A4F", fontSize: 24, fontWeight: "bold", textShadowColor: "rgba(255,255,255,0.8)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }}>
                +1
            </Text>
        </Animated.View>
    );
};

export default function BestSellersScreen() {
    const isDark = useColorScheme() === 'dark';
    const styles = getStyles(isDark);
    const router = useRouter();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [plusAnimations, setPlusAnimations] = useState<{ id: string; x: number; y: number }[]>([]);

    useEffect(() => {
        fetchBestSellers();
    }, []);

    const fetchBestSellers = async () => {
        setLoading(true);
        try {
            const result = await productsApi.getAll();
            if (result.data) {
                // For now, take first 20 as "best sellers" or filter if there's a flag
                // Assuming Best Sellers are just the top items for this demo
                setProducts(result.data.slice(0, 20));
            }
        } catch (error) {
            console.error("Error fetching best sellers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCart = (e: any, item: any) => {
        e.stopPropagation();
        addToCart(item);

        const { pageX, pageY } = e.nativeEvent;
        const id = Math.random().toString(36).substring(7);
        setPlusAnimations((prev) => [...prev, { id, x: pageX, y: pageY }]);

        setTimeout(() => {
            setPlusAnimations((prev) => prev.filter((anim) => anim.id !== id));
        }, 800);
    };

    const renderProduct = ({ item }: { item: any }) => (
        <Pressable
            style={styles.card}
            onPress={() => router.push(`/product/${item.id}` as any)}
        >
            <View style={styles.imageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <Ionicons name="cube-outline" size={40} color="#ccc" />
                )}
                <Pressable
                    style={styles.favoriteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item);
                    }}
                >
                    <Ionicons
                        name={isFavorite(item.id) ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite(item.id) ? "#EF4444" : "#9CA3AF"}
                    />
                </Pressable>
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.brand}>{item.brand?.name || "Generic"}</Text>
                <View style={styles.bottomRow}>
                    <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
                    <Pressable style={styles.addButton} onPress={(e) => handleAddCart(e, item)}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#F9FAFB" : "#1F2937"} />
                </Pressable>
                <Text style={styles.headerTitle}>Best Sellers</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2D6A4F" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {plusAnimations.map((anim) => (
                <FloatingPlusOne key={anim.id} x={anim.x} y={anim.y} />
            ))}
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    list: {
        padding: 12,
    },
    row: {
        justifyContent: "space-between",
    },
    card: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        width: "48%",
        marginBottom: 16,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        width: "100%",
        height: 120,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        position: "relative",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 12,
        resizeMode: "cover",
    },
    favoriteButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(255,255,255,0.9)",
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 4,
    },
    brand: {
        fontSize: 12,
        color: isDark ? "#9CA3AF" : "#6B7280",
        marginBottom: 8,
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2D6A4F",
    },
    addButton: {
        backgroundColor: "#2D6A4F",
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
});
