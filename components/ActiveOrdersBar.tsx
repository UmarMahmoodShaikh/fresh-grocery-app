import { ordersApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ACTIVE_STATUSES = ["pending", "processing", "shipped"];

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    pending: { bg: "#FEF3C7", text: "#D97706", dot: "#D97706" },
    processing: { bg: "#DBEAFE", text: "#2563EB", dot: "#2563EB" },
    shipped: { bg: "#EDE9FE", text: "#7C3AED", dot: "#7C3AED" },
};

interface ActiveOrder {
    id: number;
    status: string;
    total: number;
    order_items?: any[];
    created_at: string;
}

export default function ActiveOrdersBar() {
    const router = useRouter();
    const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
    const [expanded, setExpanded] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        loadActiveOrders();
        // Poll every 30 seconds
        const interval = setInterval(loadActiveOrders, 30_000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeOrders.length > 0 && !visible) {
            setVisible(true);
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 60,
                friction: 10,
            }).start();
        } else if (activeOrders.length === 0 && visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start(() => setVisible(false));
        }
    }, [activeOrders]);

    const loadActiveOrders = async () => {
        try {
            const result = await ordersApi.getAll();
            if (result.data && Array.isArray(result.data)) {
                const active = (result.data as ActiveOrder[]).filter((o) =>
                    ACTIVE_STATUSES.includes(o.status?.toLowerCase())
                );
                setActiveOrders(active);
            }
        } catch {
            // silently fail
        }
    };

    if (!visible || activeOrders.length === 0) return null;

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
    });

    const firstOrder = activeOrders[0];
    const sc = STATUS_COLORS[firstOrder.status?.toLowerCase()] ?? STATUS_COLORS.pending;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
            <TouchableOpacity
                style={[styles.bar, { backgroundColor: sc.bg }]}
                onPress={() => setExpanded((p) => !p)}
                activeOpacity={0.9}
            >
                <View style={styles.barLeft}>
                    {/* Pulsing dot */}
                    <View style={[styles.dot, { backgroundColor: sc.dot }]} />
                    <View>
                        <Text style={[styles.barTitle, { color: sc.text }]}>
                            {activeOrders.length === 1
                                ? `Order #${firstOrder.id} • ${firstOrder.status?.toUpperCase()}`
                                : `${activeOrders.length} Active Orders`}
                        </Text>
                        <Text style={[styles.barSub, { color: sc.text }]}>
                            {activeOrders.length === 1
                                ? `€${Number(firstOrder.total).toFixed(2)} · ${firstOrder.order_items?.length ?? 0} items`
                                : "Tap to view all"}
                        </Text>
                    </View>
                </View>
                <View style={styles.barRight}>
                    <Ionicons
                        name={expanded ? "chevron-down" : "chevron-up"}
                        size={16}
                        color={sc.text}
                    />
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.expandedList}>
                    {activeOrders.map((order) => {
                        const osc = STATUS_COLORS[order.status?.toLowerCase()] ?? STATUS_COLORS.pending;
                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.orderRow}
                                onPress={() => {
                                    setExpanded(false);
                                    router.push(`/order/${order.id}` as any);
                                }}
                            >
                                <View style={[styles.statusDot, { backgroundColor: osc.dot }]} />
                                <View style={styles.orderInfo}>
                                    <Text style={styles.orderId}>Order #{order.id}</Text>
                                    <Text style={styles.orderMeta}>
                                        {new Date(order.created_at).toLocaleDateString()} · {(order.order_items?.length ?? 0)} items
                                    </Text>
                                </View>
                                <View>
                                    <Text style={[styles.orderStatus, { color: osc.text }]}>
                                        {order.status?.toUpperCase()}
                                    </Text>
                                    <Text style={styles.orderTotal}>€{Number(order.total).toFixed(2)}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 80, // above tab bar
        left: 12,
        right: 12,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 999,
    },
    bar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    barLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    barTitle: { fontSize: 14, fontWeight: "700" },
    barSub: { fontSize: 12, marginTop: 2, opacity: 0.8 },
    barRight: { padding: 4 },
    expandedList: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 4 },
    orderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        gap: 10,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    orderInfo: { flex: 1 },
    orderId: { fontSize: 14, fontWeight: "600", color: "#111827" },
    orderMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
    orderStatus: { fontSize: 11, fontWeight: "700", textAlign: "right" },
    orderTotal: { fontSize: 13, fontWeight: "600", color: "#111827", textAlign: "right" },
});
