import { productsApi } from "@/services/api";
import { Camera, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function ScannerScreen() {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [manualBarcode, setManualBarcode] = useState("");
    const router = useRouter();

    // Product Form State
    const [productForm, setProductForm] = useState<{
        barcode: string;
        name: string;
        price: string;
        stock: string;
        description: string;
        image_url: string;
    } | null>(null);
    const [fetchingApi, setFetchingApi] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const getBarCodeScannerPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        };

        getBarCodeScannerPermissions();
    }, []);

    const fetchOpenFoodFacts = async (barcode: string) => {
        setFetchingApi(true);
        try {
            const resp = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const json = await resp.json();

            let name = "";
            let image_url = "";
            let description = "";

            if (json.status === 1 && json.product) {
                name = json.product.product_name || "";
                image_url = json.product.image_url || "";
                description = json.product.categories || "";
            }

            setProductForm({
                barcode,
                name,
                price: "",
                stock: "10",
                description,
                image_url,
            });
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not fetch from OpenFoodFacts");
            setProductForm({
                barcode,
                name: "",
                price: "",
                stock: "10",
                description: "",
                image_url: "",
            });
        } finally {
            setFetchingApi(false);
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        fetchOpenFoodFacts(data);
    };

    const handleSaveProduct = async () => {
        if (!productForm || !productForm.name || !productForm.price) {
            Alert.alert("Error", "Please fill name and price");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                barcode: productForm.barcode,
                name: productForm.name,
                price: parseFloat(productForm.price),
                stock: parseInt(productForm.stock),
                description: productForm.description,
                image_url: productForm.image_url,
            };

            const result = await productsApi.create(payload);
            if (result.error) {
                Alert.alert("Error", result.error);
            } else {
                Alert.alert("Success", "Product saved successfully!");
                router.push("/(admin)");
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    if (hasPermission === null) {
        return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
    }
    if (hasPermission === false) {
        return <Text style={{ textAlign: 'center', marginTop: 50 }}>No access to camera</Text>;
    }

    if (productForm) {
        return (
            <ScrollView contentContainerStyle={styles.formContainer}>
                <Text style={styles.formTitle}>Product Details</Text>

                {productForm.image_url ? (
                    <Image source={{ uri: productForm.image_url }} style={styles.formImage} />
                ) : (
                    <View style={[styles.formImage, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text>No Image</Text>
                    </View>
                )}

                <Text style={styles.label}>Barcode</Text>
                <TextInput style={[styles.input, { backgroundColor: '#e5e7eb' }]} value={productForm.barcode} editable={false} />

                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} value={productForm.name} onChangeText={(t) => setProductForm({ ...productForm, name: t })} />

                <Text style={styles.label}>Price (€)</Text>
                <TextInput style={styles.input} value={productForm.price} onChangeText={(t) => setProductForm({ ...productForm, price: t })} keyboardType="numeric" />

                <Text style={styles.label}>Stock</Text>
                <TextInput style={styles.input} value={productForm.stock} onChangeText={(t) => setProductForm({ ...productForm, stock: t })} keyboardType="numeric" />

                <Text style={styles.label}>Description / Category Tags</Text>
                <TextInput style={styles.input} value={productForm.description} onChangeText={(t) => setProductForm({ ...productForm, description: t })} multiline />

                <View style={styles.formActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setProductForm(null); setScanned(false); }}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Product</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.container}>
            {fetchingApi ? (
                <View style={styles.fetchingOverlay}>
                    <ActivityIndicator size="large" color="#2D6A4F" />
                    <Text style={{ marginTop: 10, color: '#333' }}>Fetching OpenFoodFacts...</Text>
                </View>
            ) : (
                <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a"],
                    }}
                    style={StyleSheet.absoluteFillObject}
                />
            )}

            {!fetchingApi && (
                <View style={styles.manualEntry}>
                    <TextInput
                        style={styles.manualInput}
                        placeholder="Manual Barcode"
                        value={manualBarcode}
                        onChangeText={setManualBarcode}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        style={styles.manualSearchBtn}
                        onPress={() => handleBarCodeScanned({ type: "manual", data: manualBarcode })}
                    >
                        <Text style={styles.manualSearchText}>Search</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fetchingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    manualEntry: {
        position: "absolute",
        bottom: 30,
        width: "90%",
        alignSelf: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        flexDirection: "row",
        alignItems: "center",
    },
    manualInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: '#fff',
        padding: 12,
        marginRight: 10,
        borderRadius: 8,
    },
    manualSearchBtn: {
        backgroundColor: '#2D6A4F',
        padding: 14,
        borderRadius: 8,
    },
    manualSearchText: { color: '#fff', fontWeight: 'bold' },

    // Form styles
    formContainer: { padding: 20, backgroundColor: '#F9FAFB', flexGrow: 1 },
    formTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    formImage: { width: 150, height: 150, alignSelf: 'center', borderRadius: 12, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    formActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 40 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginRight: 10, alignItems: 'center' },
    cancelBtnText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
    saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#2D6A4F', marginLeft: 10, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
