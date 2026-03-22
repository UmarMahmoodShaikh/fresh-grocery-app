import { BasketLoader } from "@/components/BasketLoader";
import { ordersApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
    pending: { color: "#D97706", bg: "#FEF3C7", icon: "time-outline", label: "Pending" },
    processing: { color: "#2563EB", bg: "#DBEAFE", icon: "refresh-outline", label: "Processing" },
    shipped: { color: "#7C3AED", bg: "#EDE9FE", icon: "bicycle-outline", label: "Shipped" },
    delivered: { color: "#059669", bg: "#D1FAE5", icon: "checkmark-circle-outline", label: "Delivered" },
    cancelled: { color: "#DC2626", bg: "#FEE2E2", icon: "close-circle-outline", label: "Cancelled" },
};

const statusFor = (status: string) =>
    STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.pending;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) load(parseInt(id, 10));
    }, [id]);

    const load = async (orderId: number) => {
        setLoading(true);
        const result = await ordersApi.getById(orderId);
        if (result.data && !result.error) {
            setOrder(result.data);
        } else {
            setError(result.error ?? "Order not found");
        }
        setLoading(false);
    };

    // ── Status timeline steps ─────────────────────────────────────────────────

    const STEPS = ["pending", "processing", "shipped", "delivered"];
    const currentStep = STEPS.indexOf(order?.status ?? "pending");

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
                <BasketLoader text="Loading order details…" backgroundColor="transparent" />
            </SafeAreaView>
        );
    }

    if (error || !order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                    <Text style={styles.errorText}>{error ?? "Order not found"}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const s = statusFor(order.status);
    const orderItems: any[] = order.order_items ?? [];
    const subtotal = orderItems.reduce(
        (sum: number, i: any) => sum + Number(i.price) * Number(i.quantity), 0
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#F9FAFB" : "#1F2937"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order.id}</Text>
                <View style={[styles.statusChip, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusChipText, { color: s.color }]}>{s.label}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Status timeline */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Status</Text>
                    <View style={styles.timeline}>
                        {STEPS.map((step, i) => {
                            const sc = statusFor(step);
                            const done = i <= currentStep;
                            return (
                                <View key={step} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.timelineDot, done ? styles.timelineDotDone : styles.timelineDotTodo]}>
                                            <Ionicons name={sc.icon as any} size={13} color={done ? "#fff" : "#D1D5DB"} />
                                        </View>
                                        {i < STEPS.length - 1 && (
                                            <View style={[styles.timelineConnector, i < currentStep && styles.timelineConnectorDone]} />
                                        )}
                                    </View>
                                    <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                                        {sc.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Order Summary</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>
                            {new Date(order.created_at).toLocaleDateString("en-GB", {
                                day: "numeric", month: "long", year: "numeric",
                            })}
                        </Text>
                    </View>
                    {order.delivery_address ? (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Address</Text>
                            <Text style={styles.infoValue}>{order.delivery_address}</Text>
                        </View>
                    ) : null}
                </View>

                {/* Items */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Items ({orderItems.length})</Text>
                    {orderItems.map((item: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            {item.product?.image_url ? (
                                <Image source={{ uri: item.product.image_url }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                                    <Ionicons name="cube-outline" size={18} color="#D1D5DB" />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.product?.name ?? `Product #${item.product_id}`}
                                </Text>
                                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                €{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                            </Text>
                        </View>
                    ))}

                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>€{subtotal.toFixed(2)}</Text>
                    </View>
                    {order.delivery_fee ? (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery</Text>
                            <Text style={styles.summaryValue}>€{Number(order.delivery_fee).toFixed(2)}</Text>
                        </View>
                    ) : null}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>€{Number(order.total).toFixed(2)}</Text>
                    </View>
                </View>

                {/* Invoice */}
                {order.invoice && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Invoice</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Invoice #</Text>
                            <Text style={styles.infoValue}>{order.invoice.id}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-done-outline" size={16} color="#6B7280" />
                            <Text style={styles.infoLabel}>Status</Text>
                            <Text style={[styles.infoValue, { textTransform: "capitalize" }]}>
                                {order.invoice.status}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Feedback Section */}
                {order.status === "delivered" && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Feedback</Text>
                        {order.score ? (
                            <View>
                                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 4 }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Ionicons
                                            key={star}
                                            name={star <= order.score ? "star" : "star-outline"}
                                            size={20}
                                            color="#F59E0B"
                                        />
                                    ))}
                                    <Text style={{ fontSize: 14, color: isDark ? "#D1D5DB" : "#4B5563", marginLeft: 8 }}>{order.score} / 5</Text>
                                </View>
                                {order.comments ? (
                                    <Text style={{ fontSize: 14, color: isDark ? "#D1D5DB" : "#374151", fontStyle: "italic" }}>"{order.comments}"</Text>
                                ) : (
                                    <Text style={{ fontSize: 14, color: isDark ? "#D1D5DB" : "#9CA3AF", fontStyle: "italic" }}>No additional comments provided.</Text>
                                )}
                            </View>
                        ) : (
                            <View>
                                <Text style={{ fontSize: 14, color: isDark ? "#D1D5DB" : "#4B5563", marginBottom: 12 }}>
                                    How was your experience with this order?
                                </Text>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: isDark ? "#F9FAFB" : "#1F2937",
                                        padding: 12,
                                        borderRadius: 8,
                                        alignItems: "center",
                                    }}
                                    onPress={() => router.push(`/order/${order.id}/feedback` as any)}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "600" }}>Leave Feedback</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    errorText: { fontSize: 16, color: "#EF4444", textAlign: "center", marginVertical: 16 },
    backBtn: { backgroundColor: isDark ? "#F9FAFB" : "#1F2937", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    backBtnText: { color: "#fff", fontWeight: "bold" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
        gap: 10,
    },
    headerBack: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827" },
    statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    statusChipText: { fontSize: 12, fontWeight: "700" },

    scroll: { padding: 16 },
    card: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", marginBottom: 14 },

    // Timeline
    timeline: {},
    timelineRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 0 },
    timelineLeft: { alignItems: "center", marginRight: 14, width: 28 },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    timelineDotDone: { backgroundColor: "#2D6A4F" },
    timelineDotTodo: { backgroundColor: isDark ? "#111827" : "#f3f4f6" },
    timelineConnector: { width: 2, height: 20, backgroundColor: isDark ? "#374151" : "#E5E7EB" },
    timelineConnectorDone: { backgroundColor: "#2D6A4F" },
    timelineLabel: { fontSize: 14, color: isDark ? "#D1D5DB" : "#9CA3AF", paddingTop: 6 },
    timelineLabelDone: { color: isDark ? "#F9FAFB" : "#111827", fontWeight: "600" },

    // Info rows
    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
    infoLabel: { fontSize: 13, color: isDark ? "#9CA3AF" : "#6B7280", width: 64 },
    infoValue: { flex: 1, fontSize: 13, fontWeight: "600", color: isDark ? "#F9FAFB" : "#111827" },

    // Items
    itemRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    itemImage: { width: 48, height: 48, borderRadius: 10 },
    itemImagePlaceholder: { backgroundColor: isDark ? "#111827" : "#f3f4f6", alignItems: "center", justifyContent: "center" },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "600", color: isDark ? "#F9FAFB" : "#111827", lineHeight: 18 },
    itemQty: { fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 3 },
    itemPrice: { fontSize: 14, fontWeight: "700", color: "#2D6A4F" },

    divider: { height: 1, backgroundColor: isDark ? "#111827" : "#f3f4f6", marginVertical: 10 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    summaryLabel: { fontSize: 14, color: isDark ? "#9CA3AF" : "#6B7280" },
    summaryValue: { fontSize: 14, color: isDark ? "#D1D5DB" : "#374151", fontWeight: "500" },
    totalLabel: { fontSize: 16, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827" },
    totalValue: { fontSize: 18, fontWeight: "800", color: "#2D6A4F" },
});
