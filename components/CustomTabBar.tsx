import { useCart } from "@/context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
    Platform,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab icon maps ─────────────────────────────────────────────────────────────

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home-outline",
    cart: "bag-outline",
    budget: "wallet-outline",
    account: "person-outline",
    scanner: "scan-outline",
};

const ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home",
    cart: "bag",
    budget: "wallet",
    account: "person",
    scanner: "scan",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { cartItems } = useCart();

    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    // We want to show items horizontally.
    // Home, Cart, Account, Scanner are always there.
    const visibleRoutesCount = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        const isHidden = route.name.startsWith("_") || (options as any).href === null;
        if (isHidden) return false; // Keep hidden routes out of the bar
        return !!ICONS[route.name];
    }).length;

    const innerWidth = width * 0.9 - 24;
    const ITEM_WIDTH = innerWidth / Math.min(visibleRoutesCount, 5); // Max 5 items visible before scrolling? 
    // Actually simplicity: if 5 items, ITEM_WIDTH = innerWidth / 5.


    return (
        <View style={[styles.wrapper, { paddingBottom: Platform.OS === "ios" ? insets.bottom + 6 : 16 }]} pointerEvents="box-none">
            <View style={styles.tabBar} pointerEvents="auto">
                <View style={styles.rowContent}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];

                        // Skip rendering if route has href: null (hidden) or starts with _
                        // OR if we don't have an icon defined for it
                        const isHidden = route.name.startsWith("_") || (options as any).href === null;

                        if (isHidden) return null;
                        if (!ICONS[route.name]) return null;

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
                            <View key={route.key} style={styles.itemWrapper}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    testID={(options as any).tabBarTestID}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={[styles.tabItem, isFocused && styles.tabItemFocused]}
                                >
                                    <View pointerEvents="none">
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
                                </TouchableOpacity>
                            </View>
                        );
                    })}


                </View>
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
        zIndex: 100,
        elevation: 100,
    },
    rowContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
    },
    itemWrapper: {
        alignItems: "center",
        justifyContent: "center",
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
    tabItem: {
        width: 48,
        height: 48,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    tabItemFocused: {
        backgroundColor: "#63c276",
        width: 56,
        height: 56,
        borderRadius: 28,
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
