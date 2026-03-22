import { useCart } from "@/context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CartScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert("Error", "Your cart is empty");
            return;
        }
        router.push("/checkout" as any);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.cartItem}>
            <View style={styles.imageContainer}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <Ionicons name="cube-outline" size={32} color="#ccc" />
                )}
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.itemPrice}>€{Number(item.price * item.quantity).toFixed(2)}</Text>

                <View style={styles.quantityContainer}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color="#374151" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
                <Text style={styles.title}>My Cart</Text>
                <Text style={styles.subtitle}>Your cart is currently empty.</Text>
                <TouchableOpacity style={styles.shopNowBtn} onPress={() => router.push("/(tabs)")}>
                    <Text style={styles.shopNowText}>Start Shopping</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart</Text>
                <TouchableOpacity onPress={() => Alert.alert(
                    "Clear Cart",
                    "Are you sure you want to remove all items?",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Clear", onPress: clearCart, style: "destructive" }
                    ]
                )}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={[styles.totalValue, { fontSize: 18, color: isDark ? "#9CA3AF" : "#6B7280" }]}>€{cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Special Offer (20%)</Text>
                    <Text style={[styles.totalValue, { fontSize: 18, color: "#059669" }]}>-€{(cartTotal * 0.20).toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>€{(cartTotal * 0.80).toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                    <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: isDark ? "#9CA3AF" : "#6B7280",
        marginBottom: 24,
    },
    shopNowBtn: {
        backgroundColor: "#2D6A4F",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopNowText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    container: {
        flex: 1,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    clearText: {
        color: "#EF4444",
        fontWeight: "600",
        fontSize: 16,
    },
    listContainer: {
        padding: 16,
    },
    cartItem: {
        flexDirection: "row",
        backgroundColor: isDark ? "#1F2937" : "#fff",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: "center",
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    imageContainer: {
        width: 70,
        height: 70,
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#2D6A4F",
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    qtyBtn: {
        padding: 6,
    },
    qtyText: {
        paddingHorizontal: 12,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    deleteBtn: {
        padding: 8,
        marginLeft: 8,
    },

    footer: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        marginBottom: 80, // Accommodate for bottom tab
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "600",
        color: isDark ? "#D1D5DB" : "#4B5563",
    },
    totalValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    checkoutBtn: {
        backgroundColor: "#2D6A4F",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    checkoutText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
