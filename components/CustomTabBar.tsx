import { useCart } from "@/context/CartContext";
import { authApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab icon maps ─────────────────────────────────────────────────────────────

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home-outline",
    cart: "bag-outline",
    account: "person-outline",
    scanner: "scan-outline",
};

const ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home",
    cart: "bag",
    account: "person",
    scanner: "scan",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { cartItems } = useCart();

    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await authApi.logout();
                    router.replace("/(auth)/login" as any);
                },
            },
        ]);
    };

    // We want to show exactly 3 items at a time horizontally.
    // The tab bar has paddingHorizontal: 12 on each side (total 24).
    // Inner width = width * 0.9 - 24.
    const innerWidth = width * 0.9 - 24;
    const ITEM_WIDTH = innerWidth / 3;

    return (
        <View style={[styles.wrapper, { paddingBottom: Platform.OS === "ios" ? insets.bottom + 6 : 16 }]}>
            <View style={styles.tabBar}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];

                        // Skip rendering if route has href: null (hidden) or starts with _
                        if (route.name.startsWith("_") || (options as any).href === null) {
                            return null;
                        }

                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        // Determine icons
                        const iconName = isFocused ? ICONS_ACTIVE[route.name] : ICONS[route.name];

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({ type: "tabLongPress", target: route.key });
                        };

                        return (
                            <View key={route.key} style={{ width: ITEM_WIDTH, alignItems: "center" }}>
                                <Pressable
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    testID={(options as any).tabBarTestID}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={[styles.tabItem, isFocused && styles.tabItemFocused]}
                                >
                                    <View>
                                        <Ionicons
                                            name={iconName || "ellipse-outline"}
                                            size={22}
                                            color={isFocused ? "#fff" : "#9CA3AF"}
                                        />
                                        {route.name === "cart" && cartItemCount > 0 && (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>{cartItemCount}</Text>
                                            </View>
                                        )}
                                    </View>
                                    {isFocused && (
                                        <Text style={styles.tabLabelFocused} numberOfLines={1}>
                                            {typeof label === "string" ? label : route.name}
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        );
                    })}

                    {/* ── Custom Logout Tab ────────────────────────────────────────── */}
                    <View style={{ width: ITEM_WIDTH, alignItems: "center" }}>
                        <Pressable
                            style={styles.tabItem}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                            {/* Not showing text unless active, and logout is never 'active' */}
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        backgroundColor: "transparent",
    },
    tabBar: {
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        width: "90%",
        alignSelf: "center",
    },
    scrollContent: {
        alignItems: "center",
        // Ensure the scroll view hugs the items properly but allows scrolling
    },
    tabItem: {
        padding: 12,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    tabItemFocused: {
        backgroundColor: "#63c276",
        paddingHorizontal: 20,
        // Add a max width so horizontal scroll doesn't break if label is very long
        maxWidth: 120,
    },
    tabLabelFocused: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 8,
        textTransform: "capitalize",
        flexShrink: 1, // Let text shrink gracefully if needed
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    }
});
