import { ordersApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HistoryScreen() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const result = await ordersApi.getAll();
            if (result.data) {
                setOrders(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const renderOrder = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <Text style={[
                    styles.orderStatus,
                    { color: item.status === 'delivered' ? '#059669' : '#D97706' }
                ]}>
                    {item.status?.toUpperCase() || 'UNKNOWN'}
                </Text>
            </View>
            <View style={styles.orderDetails}>
                <Text style={styles.orderDate}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.orderTotal}>€{Number(item.total).toFixed(2)}</Text>
            </View>
            <View style={styles.itemsSummary}>
                <Text style={styles.itemsText}>
                    {item.order_items?.length || 0} item{item.order_items?.length !== 1 ? 's' : ''}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Order History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2D6A4F" />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No Orders Yet</Text>
                    <Text style={styles.subtitle}>You haven't placed any orders.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.listContainer}
                    refreshing={loading}
                    onRefresh={fetchOrders}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    backBtn: {
        padding: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#374151",
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
    },
    listContainer: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },
    orderStatus: {
        fontSize: 13,
        fontWeight: "bold",
    },
    orderDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    orderDate: {
        fontSize: 14,
        color: "#6B7280",
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
    },
    itemsSummary: {
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 12,
        marginTop: 4,
    },
    itemsText: {
        fontSize: 14,
        color: "#4B5563",
    },
});
