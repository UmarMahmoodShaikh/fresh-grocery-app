import { StyleSheet, Text,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.subtitle}>Coming soon...</Text>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: isDark ? "#F9FAFB" : "#1F2937",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: isDark ? "#9CA3AF" : "#6B7280",
    },
});
