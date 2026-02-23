import { invoicesApi } from "@/services/api";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Button,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const STATUSES = ["unpaid", "paid", "refunded", "cancelled"];

export default function AdminInvoicesScreen() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [orderIdSearch, setOrderIdSearch] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Search trigger
    useEffect(() => {
        setOffset(0);
        loadInvoices(true);
    }, [orderIdSearch]);

    // Load invoices
    const loadInvoices = async (reset = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        const currentOffset = reset ? 0 : offset;
        try {
            const result = await invoicesApi.getAll({
                offset: currentOffset,
                limit: 10,
                order_id: orderIdSearch || undefined
            });

            if (result.data) {
                if (reset) {
                    setInvoices(result.data as any[]);
                } else {
                    setInvoices([...invoices, ...(result.data as any[])]);
                }
                setOffset(currentOffset + 10);
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (reset) setLoading(false);
            else setLoadingMore(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedInvoice) return;
        try {
            await invoicesApi.update(selectedInvoice.id, { status });
            setSelectedInvoice(null);
            setOffset(0);
            loadInvoices(true);
        } catch (e) {
            console.error(e);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.invoiceNumber}>Invoice #{item.id}</Text>
                <Text style={[styles.status, { color: item.status === 'paid' ? 'green' : 'orange' }]}>
                    {item.status?.toUpperCase() || "UNKNOWN"}
                </Text>
            </View>
            <Text style={styles.detail}>Order ID: {item.order_id}</Text>
            <Text style={styles.detail}>Total: €{Number(item.total).toFixed(2)}</Text>

            <TouchableOpacity
                style={styles.updateButton}
                onPress={() => setSelectedInvoice(item)}
            >
                <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Order ID..."
                    value={orderIdSearch}
                    onChangeText={setOrderIdSearch}
                    keyboardType="numeric"
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2D6A4F" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={(item, index) => item.id.toString() + index}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    onRefresh={() => loadInvoices(true)}
                    refreshing={loading}
                    onEndReached={() => {
                        if (!loadingMore && invoices.length >= offset) {
                            loadInvoices(false);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#2D6A4F" /> : null}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No invoices found</Text>}
                />
            )}

            {/* Update Status Modal */}
            {selectedInvoice && (
                <Modal transparent animationType="slide" visible={!!selectedInvoice}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Update Invoice #{selectedInvoice.id} Status</Text>
                            {STATUSES.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={styles.statusOption}
                                    onPress={() => handleUpdateStatus(status)}
                                >
                                    <Text style={styles.statusOptionText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                            <Button title="Cancel" onPress={() => setSelectedInvoice(null)} color="red" />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    searchContainer: { padding: 16, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2 },
    searchInput: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, fontSize: 16 },
    card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    invoiceNumber: { fontSize: 16, fontWeight: "bold" },
    status: { fontSize: 14, fontWeight: "bold" },
    detail: { fontSize: 14, color: "#4B5563", marginBottom: 4 },
    updateButton: { marginTop: 12, backgroundColor: "#2D6A4F", padding: 10, borderRadius: 8, alignItems: "center" },
    updateButtonText: { color: "#fff", fontWeight: "bold" },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', width: '80%', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    statusOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
    statusOptionText: { fontSize: 16, color: '#333' }
});
