import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentMethods() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#fff" : "#1F2937"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyText}>No payment methods saved yet.</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    containerDark: {
      backgroundColor: "#111827",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    headerDark: {
      backgroundColor: "#1F2937",
      borderBottomColor: "#374151",
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Outfit-Bold",
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    textDark: {
      color: "#F9FAFB",
    },
    textMutedDark: {
      color: isDark ? "#D1D5DB" : "#9CA3AF",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? "#9CA3AF" : "#6B7280",
      fontFamily: "Outfit-Regular",
      marginBottom: 24,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#2D6A4F",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontFamily: "Outfit-Bold",
    },
  });
