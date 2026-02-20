import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home-outline",
    favorites: "heart-outline",
    cart: "bag-outline",
    history: "ticket-outline",
    account: "person-outline",
};

const ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
    index: "home",
    favorites: "heart",
    cart: "bag",
    history: "ticket",
    account: "person",
};

export default function CustomTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20 }]}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

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
                        navigation.emit({
                            type: "tabLongPress",
                            target: route.key,
                        });
                    };

                    const iconName = isFocused ? ICONS_ACTIVE[route.name] : ICONS[route.name];

                    // We skip rendering if the route starts with _ or if it's explicitly hidden
                    if (route.name.startsWith("_") || (options as any).href === null) {
                        return null;
                    }

                    return (
                        <Pressable
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={(options as any).tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[
                                styles.tabItem,
                                isFocused && styles.tabItemFocused,
                            ]}
                        >
                            <Ionicons
                                name={iconName || "ellipse-outline"}
                                size={22}
                                color={isFocused ? "#fff" : "#9CA3AF"}
                            />
                            {isFocused && (
                                <Text style={styles.tabLabelFocused}>
                                    {typeof label === 'string' ? label : route.name}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    tabBar: {
        flexDirection: "row",
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%', // Keep floating look
        alignSelf: 'center',
    },
    tabItem: {
        padding: 12,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    tabItemFocused: {
        backgroundColor: "#63c276", // Light green as per design
        paddingHorizontal: 20,
    },
    tabLabelFocused: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 8,
        textTransform: 'capitalize',
    },
});
