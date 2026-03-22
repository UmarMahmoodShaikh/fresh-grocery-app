import { ordersApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline",
    label: "Pending",
  },
  processing: {
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: "refresh-outline",
    label: "Processing",
  },
  shipped: {
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "bicycle-outline",
    label: "Shipped",
  },
  delivered: {
    color: "#059669",
    bg: "#D1FAE5",
    icon: "checkmark-circle-outline",
    label: "Delivered",
  },
  cancelled: {
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
    label: "Cancelled",
  },
};

const statusFor = (s: string) =>
  STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.pending;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await ordersApi.getAll();
      if (result.data && Array.isArray(result.data)) {
        // Newest first
        setOrders([...(result.data as any[])].reverse());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh every time the tab is focused (e.g. after placing an order)
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  // ── Render order card ─────────────────────────────────────────────────────

  const renderOrder = ({ item }: { item: any }) => {
    const sc = statusFor(item.status);
    const itemCount = item.order_items?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item.id}` as any)}
        activeOpacity={0.8}
      >
        {/* Top row */}
        <View style={styles.cardTop}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={[styles.statusChip, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon as any} size={12} color={sc.color} />
            <Text style={[styles.statusText, { color: sc.color }]}>
              {sc.label}
            </Text>
          </View>
        </View>

        {/* Mid row */}
        <View style={styles.cardMid}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="bag-outline" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={styles.cardBottomRight}>
            <Text style={styles.totalValue}>
              €{Number(item.total).toFixed(2)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/account" as any)}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#F9FAFB" : "#1F2937"}
          />
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
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)" as any)}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchOrders}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#E5E7EB",
    },
    backBtn: { padding: 8 },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: isDark ? "#D1D5DB" : "#374151",
      marginTop: 16,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 24,
    },
    shopBtn: {
      backgroundColor: "#2D6A4F",
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
    },
    shopBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    listContainer: { padding: 16, paddingBottom: 40 },

    // Order card
    orderCard: {
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderRadius: 16,
      padding: 16,
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    orderId: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: { fontSize: 12, fontWeight: "700" },
    cardMid: { flexDirection: "row", gap: 20, marginBottom: 12 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: { fontSize: 13, color: isDark ? "#9CA3AF" : "#6B7280" },
    cardBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#374151" : "#F3F4F6",
    },
    totalLabel: { fontSize: 14, color: isDark ? "#9CA3AF" : "#6B7280" },
    cardBottomRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    totalValue: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
    },
  });
