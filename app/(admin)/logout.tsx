import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LogoutScreen() {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out from the Admin app?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await AsyncStorage.removeItem('user_token');
                            await AsyncStorage.removeItem('user_data');
                            setTimeout(() => {
                                router.replace("/(auth)/login");
                            }, 500);
                        } catch (e) {
                            Alert.alert("Error", "Failed to log out");
                            setIsLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="shield-checkmark-outline" size={80} color="#2D6A4F" />
                <Text style={styles.title}>Admin Panel</Text>
                <Text style={styles.subtitle}>You are currently logged in as an Administrator.</Text>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="log-out-outline" size={24} color="white" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#1F2937",
        marginTop: 20,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EF4444",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: "#EF4444",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 200,
        justifyContent: "center",
        gap: 10,
    },
    logoutText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});
