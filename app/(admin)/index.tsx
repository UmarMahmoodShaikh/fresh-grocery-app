import { BasketLoader } from "@/components/BasketLoader";
import { productsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";

export default function AdminProductsScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadProducts = async () => {
        setLoading(true);
        const result = await productsApi.getAll();
        if (result.data) {
            setProducts(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <Ionicons name="cube-outline" size={32} color="#ccc" />
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>€{Number(item.price).toFixed(2)}</Text>
                <Text style={styles.stock}>Stock: {item.stock}</Text>
            </View>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                    // TODO: Open modal or screen to edit
                }}
            >
                <Ionicons name="pencil" size={20} color="#FF6B35" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <BasketLoader text="Loading products..." />
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    onRefresh={loadProducts}
                    refreshing={loading}
                />
            )}

            {/* FAB to add new product via Scanner */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push("/(admin)/scanner")}
            >
                <Ionicons name="barcode-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    card: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    imageContainer: {
        width: 60,
        height: 60,
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    image: { width: "100%", height: "100%", borderRadius: 8 },
    infoContainer: { flex: 1 },
    name: { fontSize: 16, fontWeight: "600", color: isDark ? "#F9FAFB" : "#1F2937", marginBottom: 4 },
    price: { fontSize: 15, fontWeight: "700", color: "#2D6A4F" },
    stock: { fontSize: 13, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 4 },
    editButton: { padding: 8 },
    fab: {
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2D6A4F",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});
