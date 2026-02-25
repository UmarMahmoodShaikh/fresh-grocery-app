import { ordersApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedbackScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [score, setScore] = useState(0);
    const [comments, setComments] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (score === 0) {
            Alert.alert("Error", "Please leave a rating between 1 and 5.");
            return;
        }

        setSubmitting(true);
        const result = await ordersApi.update(parseInt(id, 10), { score, comments });
        setSubmitting(false);

        if (result.error) {
            Alert.alert("Error", result.error);
        } else {
            Alert.alert("Success", "Thank you for your feedback!", [
                { text: "OK", onPress: () => router.push(`/(tabs)/history`) }
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{id} Feedback</Text>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>How was your order?</Text>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setScore(star)}>
                                <Ionicons
                                    name={star <= score ? "star" : "star-outline"}
                                    size={40}
                                    color={star <= score ? "#F59E0B" : "#D1D5DB"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Additional Comments</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Tell us what you liked or how we can improve..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        value={comments}
                        onChangeText={setComments}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Feedback</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    headerBack: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: isDark ? "#111827" : "#f3f4f6",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", textAlign: "center" },
    headerSpacer: { width: 40 },
    scroll: { padding: 24 },
    title: { fontSize: 24, fontWeight: "700", color: isDark ? "#F9FAFB" : "#1F2937", textAlign: "center", marginBottom: 24 },
    starsContainer: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 32 },
    label: { fontSize: 16, fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: 8 },
    textArea: {
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: isDark ? "#374151" : "#E5E7EB",
        height: 120,
        textAlignVertical: "top",
        fontSize: 16,
        color: isDark ? "#F9FAFB" : "#111827",
        marginBottom: 32,
    },
    submitButton: {
        backgroundColor: "#2D6A4F",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
