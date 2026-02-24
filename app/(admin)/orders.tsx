import { ordersApi } from "@/services/api";
import { useEffect, useState } from "react";
import {
    Button,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";

import { BasketLoader } from "@/components/BasketLoader";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrdersScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const result = await ordersApi.getAll();
            if (result.data) {
                setOrders(result.data as any[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleUpdateStatus = async (status: string) => {
        if (!selectedOrder) return;
        try {
            await ordersApi.updateStatus(selectedOrder.id, status);
            setSelectedOrder(null);
            loadOrders();
        } catch (e) {
            console.error(e);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>Order #{item.id}</Text>
                <Text style={[styles.status, { color: item.status === 'delivered' ? 'green' : 'orange' }]}>
                    {item.status?.toUpperCase() || "UNKNOWN"}
                </Text>
            </View>
            <Text style={styles.detail}>Items: {item.order_items?.length || 0}</Text>
            <Text style={styles.detail}>Total: €{Number(item.total).toFixed(2)}</Text>

            <TouchableOpacity
                style={styles.updateButton}
                onPress={() => setSelectedOrder(item)}
            >
                <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <BasketLoader text="Loading orders..." />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    onRefresh={loadOrders}
                    refreshing={loading}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No orders found</Text>}
                />
            )}

            {/* Update Status Modal */}
            {selectedOrder && (
                <Modal transparent animationType="slide" visible={!!selectedOrder}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Update Order #{selectedOrder.id} Status</Text>
                            {STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={styles.statusOption}
                                    onPress={() => handleUpdateStatus(status)}
                                >
                                    <Text style={styles.statusOptionText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                            <Button title="Cancel" onPress={() => setSelectedOrder(null)} color="red" />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    card: { backgroundColor: isDark ? "#1F2937" : "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: isDark ? "#F9FAFB" : "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    orderNumber: { fontSize: 16, fontWeight: "bold" },
    status: { fontSize: 14, fontWeight: "bold" },
    detail: { fontSize: 14, color: isDark ? "#D1D5DB" : "#4B5563", marginBottom: 4 },
    updateButton: { marginTop: 12, backgroundColor: "#2D6A4F", padding: 10, borderRadius: 8, alignItems: "center" },
    updateButtonText: { color: "#fff", fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: isDark ? "#1F2937" : "#fff", width: '80%', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    statusOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
    statusOptionText: { fontSize: 16, color: '#333' }
});
