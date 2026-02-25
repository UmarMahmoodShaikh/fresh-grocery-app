import { addressesApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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

import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const { width } = Dimensions.get("window");

// Paris default coordinates
const DEFAULT_REGION: Region = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

type AddressLabel = "home" | "work" | "other";

const LABELS: { key: AddressLabel; label: string; icon: string }[] = [
    { key: "home", label: "Home", icon: "home-outline" },
    { key: "work", label: "Work", icon: "briefcase-outline" },
    { key: "other", label: "Other", icon: "location-outline" },
];

export default function AddAddressScreen() {
    const isDark = useColorScheme() === 'dark';
    const styles = getStyles(isDark);

    const params = useLocalSearchParams<{ id?: string }>();
    const isEditing = !!params.id;

    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [markerCoord, setMarkerCoord] = useState({
        latitude: DEFAULT_REGION.latitude,
        longitude: DEFAULT_REGION.longitude,
    });

    const [selectedLabel, setSelectedLabel] = useState<AddressLabel>("home");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [country, setCountry] = useState("France");
    const [isDefault, setIsDefault] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);

    useEffect(() => {
        if (isEditing) {
            loadAddress();
        } else {
            getCurrentLocation();
        }
    }, []);

    const loadAddress = async () => {
        // Fetch all and find the one we need
        const result = await addressesApi.getAll();
        if (result.data) {
            const addr = (result.data as any[]).find(
                (a: any) => a.id === Number(params.id)
            );
            if (addr) {
                setStreet(addr.street);
                setCity(addr.city);
                setZipCode(addr.zip_code);
                setCountry(addr.country);
                setSelectedLabel(addr.label as AddressLabel);
                setIsDefault(addr.is_default);
                const coord = {
                    latitude: parseFloat(addr.latitude),
                    longitude: parseFloat(addr.longitude),
                };
                setMarkerCoord(coord);
                setRegion({ ...coord, latitudeDelta: 0.005, longitudeDelta: 0.005 });
            }
        }
        setIsLoadingLocation(false);
    };

    const getCurrentLocation = async () => {
        setIsLoadingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === "granted") {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest,
                });
                const coord = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                };
                setMarkerCoord(coord);
                setRegion({ ...coord, latitudeDelta: 0.005, longitudeDelta: 0.005 });
                reverseGeocode(coord.latitude, coord.longitude);
            } else {
                Alert.alert("Permission Denied", "We need location permissions to find you.");
            }
        } catch {
            Alert.alert("Location Error", "Could not fetch your current location reliably from satellites or WiFi.");
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const results = await Location.reverseGeocodeAsync({
                latitude: lat,
                longitude: lon,
            });
            if (results.length > 0) {
                const r = results[0];
                setStreet(
                    [r.streetNumber, r.street].filter(Boolean).join(" ") || ""
                );
                setCity(r.city || r.subregion || "");
                setZipCode(r.postalCode || "");
                setCountry(r.country || "France");
            }
        } catch {
            // Geocoding failed, user can fill manually
        }
    };

    const handleMapPress = (e: any) => {
        const coord = e.nativeEvent.coordinate;
        setMarkerCoord(coord);
        reverseGeocode(coord.latitude, coord.longitude);
    };

    const handleMarkerDrag = (e: any) => {
        const coord = e.nativeEvent.coordinate;
        setMarkerCoord(coord);
        reverseGeocode(coord.latitude, coord.longitude);
    };

    const handleSave = async () => {
        if (!street || !city || !zipCode || !country) {
            Alert.alert("Error", "Please fill in all address fields");
            return;
        }

        setIsSaving(true);
        const addressData = {
            label: selectedLabel,
            street,
            city,
            zip_code: zipCode,
            country,
            latitude: markerCoord.latitude,
            longitude: markerCoord.longitude,
            is_default: isDefault,
        };

        try {
            let result;
            if (isEditing) {
                result = await addressesApi.update(Number(params.id), addressData);
            } else {
                result = await addressesApi.create(addressData);
            }

            if (result.error) {
                Alert.alert("Error", result.error);
            } else {
                Alert.alert(
                    "Success",
                    isEditing ? "Address updated!" : "Address saved!",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            }
        } catch {
            Alert.alert("Error", "Failed to save address");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditing ? "Edit Address" : "Add Address"}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Map */}
                    <View style={styles.mapContainer}>
                        {isLoadingLocation ? (
                            <View style={styles.mapLoading}>
                                <ActivityIndicator size="large" color="#F97316" />
                                <Text style={styles.mapLoadingText}>Getting location...</Text>
                            </View>
                        ) : (
                            <View style={{ flex: 1, position: "relative" }}>
                                <MapView
                                    ref={mapRef}
                                    provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                                    style={styles.map}
                                    region={region}
                                    onRegionChangeComplete={setRegion}
                                    onPress={handleMapPress}
                                    showsUserLocation={true}
                                    showsMyLocationButton={false}
                                >
                                    <Marker
                                        coordinate={markerCoord}
                                        draggable
                                        onDragEnd={handleMarkerDrag}
                                    />
                                </MapView>

                                <TouchableOpacity
                                    style={styles.locateButton}
                                    onPress={getCurrentLocation}
                                >
                                    <Ionicons name="locate" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.mapHint}>
                            <Ionicons name="finger-print-outline" size={14} color="#6B7280" />
                            <Text style={styles.mapHintText}>
                                Tap or drag the pin to set location
                            </Text>
                        </View>
                    </View>

                    {/* Label Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Address Type</Text>
                        <View style={styles.labelRow}>
                            {LABELS.map((item) => (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.labelChip,
                                        selectedLabel === item.key && styles.labelChipActive,
                                    ]}
                                    onPress={() => setSelectedLabel(item.key)}
                                >
                                    <Ionicons
                                        name={item.icon as any}
                                        size={18}
                                        color={selectedLabel === item.key ? "#fff" : "#6B7280"}
                                    />
                                    <Text
                                        style={[
                                            styles.labelChipText,
                                            selectedLabel === item.key &&
                                            styles.labelChipTextActive,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Address Fields */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Address Details</Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Street</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons
                                    name="location-outline"
                                    size={18}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={street}
                                    onChangeText={setStreet}
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
                                <Ionicons
                                    name="flag-outline"
                                    size={18}
                                    color="#9CA3AF"
                                    style={styles.inputIcon}
                                />
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

                    {/* Default Toggle */}
                    <TouchableOpacity
                        style={styles.defaultToggle}
                        onPress={() => setIsDefault(!isDefault)}
                    >
                        <View style={styles.defaultToggleLeft}>
                            <Ionicons
                                name={isDefault ? "star" : "star-outline"}
                                size={20}
                                color={isDefault ? "#F59E0B" : "#9CA3AF"}
                            />
                            <Text style={styles.defaultToggleText}>Set as default address</Text>
                        </View>
                        <View
                            style={[
                                styles.toggle,
                                isDefault && styles.toggleActive,
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleKnob,
                                    isDefault && styles.toggleKnobActive,
                                ]}
                            />
                        </View>
                    </TouchableOpacity>

                    {/* Coordinates display */}
                    <View style={styles.coordsBar}>
                        <Ionicons name="navigate-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.coordsText}>
                            {markerCoord.latitude.toFixed(4)},{" "}
                            {markerCoord.longitude.toFixed(4)}
                        </Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>
                                    {isEditing ? "Update Address" : "Save Address"}
                                </Text>
                            </>
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
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: isDark ? "#F9FAFB" : "#1F2937" },
    mapContainer: {
        margin: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: isDark ? "#374151" : "#E5E7EB",
    },
    map: { width: "100%", height: 220 },
    locateButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#F97316',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: isDark ? "#F9FAFB" : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    mapLoading: {
        width: "100%",
        height: 220,
        justifyContent: "center",
        alignItems: "center",
    },
    mapLoadingText: { marginTop: 8, color: isDark ? "#9CA3AF" : "#6B7280", fontSize: 14 },
    mapHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        backgroundColor: isDark ? "#111827" : "#F9FAFB",
        gap: 6,
    },
    mapHintText: { fontSize: 12, color: isDark ? "#9CA3AF" : "#6B7280" },
    section: { paddingHorizontal: 16, marginBottom: 8 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: isDark ? "#D1D5DB" : "#374151",
        marginBottom: 12,
        paddingLeft: 4,
    },
    labelRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    labelChip: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderWidth: 1.5,
        borderColor: isDark ? "#374151" : "#E5E7EB",
        gap: 6,
    },
    labelChipActive: {
        backgroundColor: "#F97316",
        borderColor: "#F97316",
    },
    labelChipText: { fontSize: 14, fontWeight: "600", color: isDark ? "#9CA3AF" : "#6B7280" },
    labelChipTextActive: { color: "#fff" },
    row: { flexDirection: "row" },
    fieldContainer: { marginBottom: 16 },
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
    inputIcon: { paddingLeft: 14 },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 15,
        color: isDark ? "#F9FAFB" : "#1F2937",
    },
    defaultToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: isDark ? "#1F2937" : "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: isDark ? "#374151" : "#E5E7EB",
    },
    defaultToggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    defaultToggleText: { fontSize: 15, fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151" },
    toggle: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: isDark ? "#374151" : "#E5E7EB",
        justifyContent: "center",
        paddingHorizontal: 2,
    },
    toggleActive: { backgroundColor: "#F97316" },
    toggleKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: isDark ? "#1F2937" : "#fff",
    },
    toggleKnobActive: { alignSelf: "flex-end" },
    coordsBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 16,
    },
    coordsText: { fontSize: 12, color: isDark ? "#D1D5DB" : "#9CA3AF" },
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: "#F97316",
        gap: 8,
    },
    saveBtnDisabled: { backgroundColor: "#FDBA74" },
    saveBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
