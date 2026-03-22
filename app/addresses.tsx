import { SafeAreaView } from "react-native-safe-area-context";
import { BasketLoader } from "@/components/BasketLoader";
import { addressesApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
    useColorScheme
} from "react-native";


interface Address {
    id: number;
    label: string;
    street: string;
    city: string;
    zip_code: string;
    country: string;
    latitude: number;
    longitude: number;
    is_default: boolean;
}

const LABEL_ICONS: Record<string, string> = {
    home: "home-outline",
    work: "briefcase-outline",
    other: "location-outline",
};

const LABEL_COLORS: Record<string, string[]> = {
    home: ["#3B82F6", "#2563EB"],
    work: ["#8B5CF6", "#7C3AED"],
    other: ["#F97316", "#EA580C"],
};

export default function AddressesScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadAddresses();
        }, [])
    );

    const loadAddresses = async () => {
        setIsLoading(true);
        const result = await addressesApi.getAll();
        if (result.data) {
            setAddresses(result.data as Address[]);
        }
        setIsLoading(false);
    };

    const handleSetDefault = async (id: number) => {
        const result = await addressesApi.setDefault(id);
        if (result.data) {
            setAddresses(result.data as Address[]);
        }
    };

    const handleDelete = (address: Address) => {
        Alert.alert(
            "Delete Address",
            `Delete "${address.label}" address at ${address.street}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const result = await addressesApi.delete(address.id);
                        if (!result.error) {
                            loadAddresses();
                        } else {
                            Alert.alert("Error", result.error);
                        }
                    },
                },
            ]
        );
    };

    const canAddMore = addresses.length < 5;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={isDark ? "#F9FAFB" : "#374151"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading ? (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <BasketLoader text="Loading your addresses..." backgroundColor="transparent" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Address Count */}
                    <View style={styles.countBar}>
                        <Text style={styles.countText}>
                            {addresses.length}/5 addresses saved
                        </Text>
                        <View
                            style={[
                                styles.countBadge,
                                addresses.length >= 5 && styles.countBadgeFull,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.countBadgeText,
                                    addresses.length >= 5 && styles.countBadgeTextFull,
                                ]}
                            >
                                {addresses.length}/5
                            </Text>
                        </View>
                    </View>

                    {/* Address Cards */}
                    {addresses.map((address) => (
                        <View key={address.id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <LinearGradient
                                    colors={
                                        (LABEL_COLORS[address.label] || LABEL_COLORS.other) as [
                                            string,
                                            string
                                        ]
                                    }
                                    style={styles.labelBadge}
                                >
                                    <Ionicons
                                        name={
                                            (LABEL_ICONS[address.label] ||
                                                "location-outline") as any
                                        }
                                        size={14}
                                        color="#fff"
                                    />
                                    <Text style={styles.labelText}>
                                        {address.label.charAt(0).toUpperCase() +
                                            address.label.slice(1)}
                                    </Text>
                                </LinearGradient>

                                {address.is_default && (
                                    <View style={styles.defaultBadge}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.defaultText}>Default</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.streetText}>{address.street}</Text>
                            <Text style={styles.cityText}>
                                {address.city}, {address.zip_code}
                            </Text>
                            <Text style={styles.countryText}>{address.country}</Text>

                            <View style={styles.cardActions}>
                                {!address.is_default && (
                                    <TouchableOpacity
                                        style={styles.actionBtn}
                                        onPress={() => handleSetDefault(address.id)}
                                    >
                                        <Ionicons
                                            name="star-outline"
                                            size={18}
                                            color="#F59E0B"
                                        />
                                        <Text style={styles.actionText}>Set Default</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() =>
                                        router.push(`/add-address?id=${address.id}`)
                                    }
                                >
                                    <Ionicons
                                        name="create-outline"
                                        size={18}
                                        color="#3B82F6"
                                    />
                                    <Text style={[styles.actionText, { color: "#3B82F6" }]}>
                                        Edit
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleDelete(address)}
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={18}
                                        color="#EF4444"
                                    />
                                    <Text style={[styles.actionText, { color: "#EF4444" }]}>
                                        Delete
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {addresses.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No saved addresses</Text>
                            <Text style={styles.emptySubtitle}>
                                Add your first address to get started
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Add Address FAB */}
            {canAddMore && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push("/add-address")}
                >
                    <LinearGradient
                        colors={["#F97316", "#EA580C"]}
                        style={styles.fabGradient}
                    >
                        <Ionicons name="add" size={28} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#F9FAFB" : "#1F2937" },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: { marginTop: 12, fontSize: 16, color: isDark ? "#9CA3AF" : "#6B7280" },
    scrollContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    countBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    countText: { fontSize: 14, color: isDark ? "#9CA3AF" : "#6B7280", fontWeight: "500" },
    countBadge: {
        backgroundColor: "#DBEAFE",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeFull: { backgroundColor: "#FEE2E2" },
    countBadgeText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
    countBadgeTextFull: { color: "#EF4444" },
    card: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    labelBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 4,
    },
    labelText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    defaultBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
        backgroundColor: "#FFFBEB",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
    },
    defaultText: { fontSize: 11, color: "#D97706", fontWeight: "600" },
    streetText: {
        fontSize: 16,
        fontWeight: "600",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 2,
    },
    cityText: { fontSize: 14, color: isDark ? "#9CA3AF" : "#6B7280" },
    countryText: { fontSize: 13, color: isDark ? "#D1D5DB" : "#9CA3AF", marginBottom: 12 },
    cardActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 12,
        gap: 16,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    actionText: { fontSize: 13, color: "#F59E0B", fontWeight: "500" },
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: isDark ? "#D1D5DB" : "#374151",
        marginTop: 16,
    },
    emptySubtitle: { fontSize: 14, color: isDark ? "#D1D5DB" : "#9CA3AF", marginTop: 4 },
    fab: {
        position: "absolute",
        bottom: 32,
        right: 24,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#F97316",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
