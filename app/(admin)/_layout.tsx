import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AdminLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: "#2D6A4F",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Products",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="cube-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: "Invoices",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="document-text-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="cart-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    href: null,
                    title: "Scanner",
                }}
            />
            <Tabs.Screen
                name="logout"
                options={{
                    title: "Logout",
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="log-out-outline" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

