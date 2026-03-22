import { BasketLoader } from "@/components/BasketLoader";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_LABELS: Record<string, string> = {
    cash: "Cash on Delivery",
    card: "Credit / Debit Card",
    paypal: "PayPal",
};

const PAYMENT_ICONS: Record<string, string> = {
    cash: "cash-outline",
    card: "card-outline",
    paypal: "logo-paypal",
};

export default function OrderConfirmationScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const router = useRouter();
    const { orderId, total, paymentMethod, itemCount, address } = useLocalSearchParams<{
        orderId: string;
        total: string;
        paymentMethod: string;
        itemCount: string;
        address: string;
    }>();

    const [showDetails, setShowDetails] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    // Show the basket animation for 2.5 seconds then reveal confirmation
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowDetails(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 60,
                    friction: 8,
                }),
            ]).start();
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    if (!showDetails) {
        return (
            <SafeAreaView style={styles.loaderContainer}>
                <BasketLoader text="Placing your order…" backgroundColor="transparent" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                {/* Success badge */}
                <View style={styles.successWrap}>
                    <LinearGradient
                        colors={["#2D6A4F", "#40916C"]}
                        style={styles.successCircle}
                    >
                        <Ionicons name="checkmark" size={52} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.successTitle}>Order Placed! 🎉</Text>
                    <Text style={styles.successSub}>
                        Your order has been confirmed and is being prepared.
                    </Text>
                </View>

                {/* Order ID card */}
                <LinearGradient
                    colors={["#2D6A4F", "#40916C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.orderIdCard}
                >
                    <Text style={styles.orderIdLabel}>ORDER ID</Text>
                    <Text style={styles.orderIdValue}>#{orderId}</Text>
                    <Text style={styles.orderIdSub}>Keep this for your records</Text>
                </LinearGradient>

                {/* Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="receipt-outline" size={20} color="#2D6A4F" />
                        </View>
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Total Amount</Text>
                            <Text style={styles.detailValue}>€{total}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name={(PAYMENT_ICONS[paymentMethod] ?? "card-outline") as any} size={20} color="#2D6A4F" />
                        </View>
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Payment Method</Text>
                            <Text style={styles.detailValue}>{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="bag-outline" size={20} color="#2D6A4F" />
                        </View>
                        <View style={styles.detailText}>
                            <Text style={styles.detailLabel}>Items</Text>
                            <Text style={styles.detailValue}>
                                {itemCount} item{Number(itemCount) !== 1 ? "s" : ""}
                            </Text>
                        </View>
                    </View>

                    {address ? (
                        <>
                            <View style={styles.separator} />
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <Ionicons name="location-outline" size={20} color="#2D6A4F" />
                                </View>
                                <View style={styles.detailText}>
                                    <Text style={styles.detailLabel}>Delivery Address</Text>
                                    <Text style={styles.detailValue}>{address}</Text>
                                </View>
                            </View>
                        </>
                    ) : null}
                </View>

                {/* Status tracker */}
                <View style={styles.trackerCard}>
                    <Text style={styles.trackerTitle}>Order Status</Text>
                    {[
                        { key: "confirmed", label: "Order Confirmed", icon: "checkmark-circle" },
                        { key: "processing", label: "Being Prepared", icon: "restaurant-outline" },
                        { key: "shipped", label: "Out for Delivery", icon: "bicycle-outline" },
                        { key: "delivered", label: "Delivered", icon: "home-outline" },
                    ].map((step, i) => (
                        <View key={step.key} style={styles.trackerStep}>
                            <View style={[styles.trackerDot, i === 0 ? styles.trackerDotActive : styles.trackerDotInactive]}>
                                <Ionicons
                                    name={step.icon as any}
                                    size={14}
                                    color={i === 0 ? "#fff" : "#D1D5DB"}
                                />
                            </View>
                            {i < 3 && <View style={[styles.trackerLine, i === 0 && styles.trackerLineActive]} />}
                            <Text style={[styles.trackerLabel, i === 0 && styles.trackerLabelActive]}>
                                {step.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push(`/order/${orderId}` as any)}
                >
                    <Ionicons name="eye-outline" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>View Order Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.replace("/(tabs)" as any)}
                >
                    <Ionicons name="home-outline" size={20} color="#2D6A4F" />
                    <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    loaderContainer: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB", alignItems: "center", justifyContent: "center" },
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    scroll: { padding: 20 },

    successWrap: { alignItems: "center", marginBottom: 24 },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: "#2D6A4F",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successTitle: { fontSize: 28, fontWeight: "800", color: isDark ? "#F9FAFB" : "#111827", marginBottom: 8 },
    successSub: { fontSize: 15, color: isDark ? "#9CA3AF" : "#6B7280", textAlign: "center", lineHeight: 22 },

    orderIdCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#2D6A4F",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    orderIdLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 2 },
    orderIdValue: { fontSize: 40, fontWeight: "900", color: "#fff", marginVertical: 8 },
    orderIdSub: { fontSize: 12, color: "rgba(255,255,255,0.7)" },

    detailsCard: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
    },
    detailText: { flex: 1 },
    detailLabel: { fontSize: 12, color: isDark ? "#D1D5DB" : "#9CA3AF", fontWeight: "500", marginBottom: 3 },
    detailValue: { fontSize: 15, fontWeight: "600", color: isDark ? "#F9FAFB" : "#111827" },
    separator: { height: 1, backgroundColor: isDark ? "#111827" : "#f3f4f6" },

    // Tracker
    trackerCard: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    trackerTitle: { fontSize: 15, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", marginBottom: 16 },
    trackerStep: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    trackerDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    trackerDotActive: { backgroundColor: "#2D6A4F" },
    trackerDotInactive: { backgroundColor: isDark ? "#111827" : "#f3f4f6" },
    trackerLine: {
        position: "absolute",
        left: 13,
        top: 28,
        width: 2,
        height: 24,
        backgroundColor: isDark ? "#374151" : "#E5E7EB",
        zIndex: -1,
    },
    trackerLineActive: { backgroundColor: "#2D6A4F" },
    trackerLabel: { fontSize: 14, color: isDark ? "#D1D5DB" : "#9CA3AF" },
    trackerLabelActive: { color: isDark ? "#F9FAFB" : "#111827", fontWeight: "600" },

    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#2D6A4F",
        borderRadius: 14,
        paddingVertical: 16,
        marginBottom: 12,
        shadowColor: "#2D6A4F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    secondaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: "#2D6A4F",
    },
    secondaryBtnText: { color: "#2D6A4F", fontSize: 16, fontWeight: "700" },
});
