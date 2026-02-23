import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.subtitle}>Coming soon...</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#6B7280",
    },
});
