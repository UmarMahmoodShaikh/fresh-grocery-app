import { SafeAreaView } from "react-native-safe-area-context";
import { BasketLoader } from "@/components/BasketLoader";
import { apiRequest, authApi, getStoredUser, setStoredUser } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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


interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    formatted_phone: string;
    address: string;
    zip_code: string;
    city: string;
    country: string;
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

    const [user, setUser] = useState<UserProfile | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            // First try to get fresh data from API
            const result = await authApi.me();
            if (result.data) {
                const u = result.data as unknown as UserProfile;
                setUser(u);
                populateFields(u);
            } else {
                // Fallback to stored user
                const stored = await getStoredUser();
                if (stored) {
                    setUser(stored);
                    populateFields(stored);
                }
            }
        } catch {
            const stored = await getStoredUser();
            if (stored) {
                setUser(stored);
                populateFields(stored);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const populateFields = (u: any) => {
        setFirstName(u.first_name || "");
        setLastName(u.last_name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAddress(u.address || "");
        setZipCode(u.zip_code || "");
        setCity(u.city || "");
        setCountry(u.country || "");
    };

    const checkChanges = () => {
        if (!user) return false;
        return (
            firstName !== (user.first_name || "") ||
            lastName !== (user.last_name || "") ||
            phone !== (user.phone || "") ||
            address !== (user.address || "") ||
            zipCode !== (user.zip_code || "") ||
            city !== (user.city || "") ||
            country !== (user.country || "")
        );
    };

    useEffect(() => {
        setHasChanges(checkChanges());
    }, [firstName, lastName, phone, address, zipCode, city, country]);

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const result = await apiRequest(`/users/${user.id}`, "PATCH", {
                user: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    address: address,
                    zip_code: zipCode,
                    city: city,
                    country: country,
                },
            });

            if (result.error) {
                Alert.alert("Error", result.error);
            } else {
                // Update stored user with new data
                const updatedUser = {
                    ...user,
                    first_name: firstName,
                    last_name: lastName,
                    phone: result.data?.phone || phone,
                    formatted_phone: result.data?.formatted_phone || "",
                    address: address,
                    zip_code: zipCode,
                    city: city,
                    country: country,
                };
                await setStoredUser(updatedUser);
                setUser(updatedUser as UserProfile);
                setHasChanges(false);
                Alert.alert("Success", "Profile updated successfully!", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            }
        } catch {
            Alert.alert("Error", "Failed to update profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
                <BasketLoader text="Loading your profile..." backgroundColor="transparent" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Personal Information</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={!hasChanges || isSaving}
                        style={[
                            styles.saveBtn,
                            (!hasChanges || isSaving) && styles.saveBtnDisabled,
                        ]}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text
                                style={[
                                    styles.saveBtnText,
                                    !hasChanges && styles.saveBtnTextDisabled,
                                ]}
                            >
                                Save
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <LinearGradient
                            colors={["#F97316", "#EA580C"]}
                            style={styles.avatarGradient}
                        >
                            <Text style={styles.avatarText}>
                                {[firstName, lastName]
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase() || "?"}
                            </Text>
                        </LinearGradient>
                        <Text style={styles.avatarName}>
                            {[firstName, lastName].filter(Boolean).join(" ") || "User"}
                        </Text>
                        <Text style={styles.avatarEmail}>{email}</Text>
                    </View>

                    {/* Name Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Name</Text>
                        <View style={styles.row}>
                            <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.fieldLabel}>First Name</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        placeholder="First name"
                                        placeholderTextColor="#D1D5DB"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                            <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.fieldLabel}>Last Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: 14 }]}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        placeholder="Last name"
                                        placeholderTextColor="#D1D5DB"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Contact Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Email</Text>
                            <View style={[styles.inputWrapper, styles.inputDisabled]}>
                                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: isDark ? "#D1D5DB" : "#9CA3AF" }]}
                                    value={email}
                                    editable={false}
                                />
                            </View>
                            <Text style={styles.fieldHint}>Email cannot be changed</Text>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="06 12 34 56 78"
                                    placeholderTextColor="#D1D5DB"
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <Text style={styles.fieldHint}>French format (0x xx xx xx xx) — saved as +33</Text>
                        </View>
                    </View>

                    {/* Address Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Address</Text>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Street Address</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="location-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="123 Rue de la Paix"
                                    placeholderTextColor="#D1D5DB"
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.fieldContainer, { flex: 2, marginRight: 8 }]}>
                                <Text style={styles.fieldLabel}>City</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: 14 }]}
                                        value={city}
                                        onChangeText={setCity}
                                        placeholder="Paris"
                                        placeholderTextColor="#D1D5DB"
                                    />
                                </View>
                            </View>
                            <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.fieldLabel}>Zip Code</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: 14 }]}
                                        value={zipCode}
                                        onChangeText={setZipCode}
                                        placeholder="75001"
                                        placeholderTextColor="#D1D5DB"
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Country</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="flag-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={country}
                                    onChangeText={setCountry}
                                    placeholder="France"
                                    placeholderTextColor="#D1D5DB"
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: isDark ? "#9CA3AF" : "#6B7280",
    },
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
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    saveBtn: {
        backgroundColor: "#F97316",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 70,
        alignItems: "center",
    },
    saveBtnDisabled: {
        backgroundColor: isDark ? "#374151" : "#E5E7EB",
    },
    saveBtnText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    saveBtnTextDisabled: {
        color: isDark ? "#D1D5DB" : "#9CA3AF",
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    avatarSection: {
        alignItems: "center",
        paddingVertical: 24,
    },
    avatarGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#fff",
    },
    avatarName: {
        fontSize: 20,
        fontWeight: "700",
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    avatarEmail: {
        fontSize: 14,
        color: isDark ? "#9CA3AF" : "#6B7280",
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: isDark ? "#D1D5DB" : "#374151",
        marginBottom: 12,
        paddingLeft: 4,
    },
    row: {
        flexDirection: "row",
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: isDark ? "#9CA3AF" : "#6B7280",
        marginBottom: 6,
        paddingLeft: 4,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: isDark ? "#374151" : "#E5E7EB",
        overflow: "hidden",
    },
    inputDisabled: {
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
        borderColor: isDark ? "#374151" : "#F3F4F6",
    },
    inputIcon: {
        paddingLeft: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 15,
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    fieldHint: {
        fontSize: 11,
        color: isDark ? "#D1D5DB" : "#9CA3AF",
        marginTop: 4,
        marginLeft: 4,
    },
});
