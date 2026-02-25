import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
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

export default function FavoritesScreen() {
    const isDark = useColorScheme() === 'dark';
    const styles = getStyles(isDark);
    const router = useRouter();
    const { favorites, removeFavorite } = useFavorites();
    const { addToCart } = useCart();
    const [plusAnimations, setPlusAnimations] = useState<{ id: string; x: number; y: number }[]>([]);

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

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-dislike-outline" size={80} color={isDark ? "#374151" : "#E5E7EB"} />
            </View>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySubtitle}>Tap the heart icon on any product to save it here for later.</Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)/" as any)}
            >
                <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/product/${item.id}` as any)}
        >
            <View style={styles.imageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <Ionicons name="cube-outline" size={40} color="#ccc" />
                )}
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFavorite(item.id)}
                >
                    <Ionicons name="heart" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
            </View>
            <TouchableOpacity
                style={styles.cardAddButton}
                onPress={(e) => handleAddCart(e, item)}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Favorites</Text>
                {favorites.length > 0 && (
                    <Text style={styles.count}>{favorites.length} items</Text>
                )}
            </View>

            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={favorites.length === 0 ? { flex: 1 } : styles.list}
                ListEmptyComponent={renderEmpty}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
            />

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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    count: {
        fontSize: 14,
        color: isDark ? "#9CA3AF" : "#6B7280",
    },
    list: {
        paddingHorizontal: 12,
        paddingBottom: 100, // Space for tab bar
    },
    columnWrapper: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    card: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        width: "48%",
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        width: "100%",
        height: 140,
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
    removeButton: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(255,255,255,0.9)",
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    info: {
        marginBottom: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2D6A4F",
    },
    cardAddButton: {
        position: "absolute",
        bottom: 12,
        right: 12,
        backgroundColor: "#2D6A4F",
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 15,
        color: isDark ? "#9CA3AF" : "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    browseButton: {
        backgroundColor: "#2D6A4F",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 28,
    },
    browseButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
