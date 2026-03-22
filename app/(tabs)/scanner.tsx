import { useCart } from "@/context/CartContext";
import { productsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Scanner() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const router = useRouter();
  const { addToCart } = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [internalProduct, setInternalProduct] = useState<any>(null);
  const [resultData, setResultData] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);

      // 1. Check if the product exists in OUR database
      const internalCheck = await productsApi.getByBarcode(barcode);
      let internalProd = null;
      if (
        internalCheck.data &&
        Array.isArray(internalCheck.data) &&
        internalCheck.data.length > 0
      ) {
        internalProd = internalCheck.data[0];
      }

      // If it exists in our store, show options to add to cart!
      if (internalProd) {
        setInternalProduct(internalProd);

        let nutDetails = "";
        try {
          if (internalProd.nutrition) {
            const nut =
              typeof internalProd.nutrition === "string"
                ? JSON.parse(internalProd.nutrition)
                : internalProd.nutrition;
            if (nut.calories || nut.protein || nut.fat || nut.carbohydrates) {
              nutDetails = `\n\n🥗 Nutrition Facts:\nCalories: ${
                nut.calories || 0
              } kcal\nProtein: ${nut.protein || 0}g\nFat: ${
                nut.fat || 0
              }g\nCarbs: ${nut.carbohydrates || 0}g`;
            }
          }
        } catch (e) {}

        const description = internalProd.description
          ? `\n\n📝 Details:\n${internalProd.description}`
          : "";

        setResultData({
          title:
            internalProd.stock > 0
              ? "✅ Product Found in Store!"
              : "⚠️ Product Out of Stock",
          message: `${internalProd.name}\n\n🏷️ Brand: ${
            internalProd.brand?.name || "N/A"
          }\n📦 Category: ${
            internalProd.category?.name || "N/A"
          }\n💰 Price: €${Number(internalProd.price).toFixed(2)}\n📊 Stock: ${
            internalProd.stock
          }${nutDetails}${description}`,
          type: internalProd.stock > 0 ? "success" : "warning",
        });

        setResultVisible(true);
        setLoading(false);
        return;
      }

      // 2. If not in our store, get its external details from Open Food Facts to show what they missed
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        // Product found externally but not in store
        const product = data.product;
        const categories = product.categories
          ? product.categories.split(",").slice(0, 2).join(", ")
          : "N/A";

        const externalMapped = {
          id: null, // No database ID
          name: product.product_name || "Unknown Product",
          brand: { name: product.brands || "N/A" },
          category: { name: categories },
          price: 0,
          stock: 0,
          description:
            "⚠️ This item is recognized internationally but we do not currently carry it in our local store.",
        };

        setInternalProduct(externalMapped);

        setResultData({
          title: "❌ Out of Stock",
          message: `${externalMapped.name}\n\n🏷️ Brand: ${externalMapped.brand.name}\n📦 Category: ${externalMapped.category.name}\n\n📝 Details:\n${externalMapped.description}`,
          type: "warning",
        });
        setResultVisible(true);
        setLoading(false);
        return;
      } else {
        // Product completely unknown
        setResultData({
          title: "❌ Product Not Found",
          message:
            `This barcode (${barcode}) is completely unknown.\n\n` +
            `This might be:\n` +
            `• A non-food product\n` +
            `• An invalid barcode`,
          type: "error",
        });
        setResultVisible(true);
      }
    } catch (error) {
      // Network or API error
      setResultData({
        title: "⚠️ Connection Error",
        message:
          "Unable to fetch product data. Please check your internet connection and try again.",
        type: "warning",
      });
      setResultVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned || loading) return;

    setScanned(true);

    // Validate barcode format (basic validation)
    if (!data || data.trim().length === 0) {
      setResultData({
        title: "❌ Invalid Barcode",
        message:
          "The scanned barcode is empty or unreadable. Please try again.",
        type: "error",
      });
      setResultVisible(true);
      return;
    }

    // Fetch product data from Open Food Facts API
    fetchProductData(data);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#2D6A4F" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan barcodes
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setScanned(false);
              setLoading(false);
              router.push("/(tabs)");
            }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBackButton}
          onPress={() => {
            setScanned(false);
            setLoading(false);
            router.push("/(tabs)");
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "white" : "#111827"}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code128",
              "code39",
            ],
          }}
        >
          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            {/* Top-left corner */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            {/* Top-right corner */}
            <View style={[styles.corner, styles.cornerTopRight]} />
            {/* Bottom-left corner */}
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            {/* Bottom-right corner */}
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </CameraView>
      </View>

      {/* Instruction Text */}
      <Text style={styles.instructionText}>
        Position the barcode within the frame
      </Text>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.overlayLoadingText}>
              🔍 Fetching product data...
            </Text>
          </View>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="flash" size={20} color="#FCD34D" />
          <Text style={styles.tipsTitle}>Tips for better scanning:</Text>
        </View>
        <View style={styles.tipsList}>
          <Text style={styles.tipText}>• Ensure good lighting</Text>
          <Text style={styles.tipText}>• Hold steady and align barcode</Text>
          <Text style={styles.tipText}>• Clean camera lens if needed</Text>
        </View>
      </View>

      {/* Result Modal */}
      <Modal
        visible={resultVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setResultVisible(false);
          setScanned(false);
          setLoading(false);
          setInternalProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>{resultData.title}</Text>
            <ScrollView style={{ maxHeight: 250, marginBottom: 20 }}>
              <Text style={styles.modalMessage}>{resultData.message}</Text>
            </ScrollView>

            {internalProduct ? (
              <View style={{ width: "100%" }}>
                <Pressable
                  disabled={internalProduct.stock <= 0}
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    {
                      backgroundColor:
                        internalProduct.stock > 0 ? "#2D6A4F" : "#9CA3AF",
                      marginBottom: 10,
                    },
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={() => {
                    addToCart(internalProduct);
                    setResultVisible(false);
                    setScanned(false);
                    setLoading(false);
                    setInternalProduct(null);
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>
                    {internalProduct.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Text>
                </Pressable>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  {internalProduct.id && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.modalButton,
                        styles.modalButtonSecondary,
                        { flex: 1 },
                        pressed && styles.modalButtonSecondaryPressed,
                      ]}
                      onPress={() => {
                        setResultVisible(false);
                        setScanned(false);
                        setLoading(false);
                        const id = internalProduct.id;
                        setInternalProduct(null);
                        router.push(`/product/${id}` as any);
                      }}
                    >
                      <Text style={styles.modalButtonTextSecondary}>
                        View Details
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.modalButtonSecondary,
                      { flex: 1 },
                      pressed && styles.modalButtonSecondaryPressed,
                    ]}
                    onPress={() => {
                      setResultVisible(false);
                      setScanned(false);
                      setLoading(false);
                      setInternalProduct(null);
                    }}
                  >
                    <Text style={styles.modalButtonTextSecondary}>
                      Scan Again
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={() => {
                    setResultVisible(false);
                    setScanned(false);
                    setLoading(false);
                    setInternalProduct(null);
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Scan Again</Text>
                </Pressable>

                {resultData.type === "success" && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalButton,
                      styles.modalButtonSecondary,
                      pressed && styles.modalButtonSecondaryPressed,
                    ]}
                    onPress={() => {
                      setResultVisible(false);
                      setScanned(false);
                      setLoading(false);
                      setInternalProduct(null);
                      router.push("/(tabs)");
                    }}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Go Back</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#F9FAFB",
      paddingTop: Platform.OS === "android" ? 35 : 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: isDark ? "white" : "#111827",
      fontSize: 16,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    permissionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "white" : "#111827",
      marginTop: 20,
      marginBottom: 10,
    },
    permissionText: {
      fontSize: 16,
      color: isDark ? "#D1D5DB" : "#9CA3AF",
      textAlign: "center",
      marginBottom: 30,
    },
    permissionButton: {
      backgroundColor: "#2D6A4F",
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    permissionButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    backButtonText: {
      color: isDark ? "#D1D5DB" : "#9CA3AF",
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "white" : "#111827",
    },
    headerSpacer: {
      width: 40,
    },
    cameraContainer: {
      flex: 1,
      marginHorizontal: 20,
      marginTop: 20,
      borderRadius: 20,
      overflow: "hidden",
    },
    camera: {
      flex: 1,
    },
    scanFrame: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    corner: {
      position: "absolute",
      width: 60,
      height: 60,
      borderColor: "#10B981",
      borderWidth: 4,
    },
    cornerTopLeft: {
      top: "25%",
      left: "15%",
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderTopLeftRadius: 8,
    },
    cornerTopRight: {
      top: "25%",
      right: "15%",
      borderLeftWidth: 0,
      borderBottomWidth: 0,
      borderTopRightRadius: 8,
    },
    cornerBottomLeft: {
      bottom: "25%",
      left: "15%",
      borderRightWidth: 0,
      borderTopWidth: 0,
      borderBottomLeftRadius: 8,
    },
    cornerBottomRight: {
      bottom: "25%",
      right: "15%",
      borderLeftWidth: 0,
      borderTopWidth: 0,
      borderBottomRightRadius: 8,
    },
    barcodeIconContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: 20,
      borderRadius: 16,
    },
    instructionText: {
      color: isDark ? "white" : "#4B5563",
      fontSize: 16,
      textAlign: "center",
      marginTop: 20,
      marginBottom: 16,
    },
    scanButton: {
      backgroundColor: "#10B981",
      marginHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#10B981",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    scanButtonPressed: {
      backgroundColor: "#059669",
    },
    scanButtonText: {
      color: "white",
      fontSize: 18,
      fontWeight: "bold",
    },
    tipsCard: {
      backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 110, // Increased margin to clear the custom bottom tab bar
      padding: 16,
      borderRadius: 12,
    },
    tipsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    tipsTitle: {
      color: isDark ? "white" : "#111827",
      fontSize: 16,
      fontWeight: "600",
    },
    tipsList: {
      gap: 6,
    },
    tipText: {
      color: isDark ? "#D1D5DB" : "#4B5563",
      fontSize: 14,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: isDark ? "#1F2937" : "white",
      paddingHorizontal: 32,
      paddingVertical: 24,
      borderRadius: 16,
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    overlayLoadingText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      backgroundColor: isDark ? "#1F2937" : "white",
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 15,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: isDark ? "#F9FAFB" : "#1F2937",
      marginBottom: 12,
      textAlign: "center",
    },
    modalMessage: {
      fontSize: 16,
      color: isDark ? "#D1D5DB" : "#374151",
      lineHeight: 26,
      marginBottom: 24,
    },
    modalButtons: {
      gap: 12,
    },
    modalButton: {
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 10,
    },
    modalButtonPrimary: {
      backgroundColor: "#2D6A4F",
    },
    modalButtonPressed: {
      backgroundColor: "#E55A28",
    },
    modalButtonSecondary: {
      backgroundColor: isDark ? "#374151" : "#E5E7EB",
    },
    modalButtonSecondaryPressed: {
      backgroundColor: "#D1D5DB",
    },
    modalButtonTextPrimary: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    modalButtonTextSecondary: {
      color: isDark ? "#F9FAFB" : "#1F2937",
      fontSize: 16,
      fontWeight: "600",
    },
  });
