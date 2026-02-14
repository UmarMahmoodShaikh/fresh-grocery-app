import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Scanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultData, setResultData] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        // Product found
        const product = data.product;

        // Clean up category - take only first 2 categories
        const categories = product.categories
          ? product.categories.split(",").slice(0, 2).join(", ")
          : "N/A";

        setResultData({
          title: "✅ Product Found!",
          message:
            `${product.product_name || "Unknown Product"}\n\n` +
            `📦 Brand: ${product.brands || "N/A"}\n` +
            `🏷️ Category: ${categories}\n` +
            `🔢 Barcode: ${barcode}`,
          type: "success",
        });
        setResultVisible(true);
      } else {
        // Product not found in database
        setResultData({
          title: "❌ Product Not Found",
          message:
            `This barcode (${barcode}) is not in our grocery database.\n\n` +
            `This might be:\n` +
            `• A non-food product\n` +
            `• A product not yet added to Open Food Facts\n` +
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
          <Ionicons name="camera-outline" size={80} color="#FF6B35" />
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
          <Ionicons name="arrow-back" size={24} color="white" />
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

            {/* Barcode Icon */}
            <View style={styles.barcodeIconContainer}>
              <Ionicons name="barcode-outline" size={60} color="white" />
            </View>
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
            <Text style={styles.loadingText}>🔍 Fetching product data...</Text>
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

      {/* Custom Result Modal */}
      <Modal
        visible={resultVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setResultVisible(false);
          setScanned(false);
          setLoading(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{resultData.title}</Text>
            <Text style={styles.modalMessage}>{resultData.message}</Text>

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
                    router.push("/(tabs)");
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Go Back</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
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
    color: "white",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#FF6B35",
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
    color: "#9CA3AF",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
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
    color: "white",
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
    backgroundColor: "#374151",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
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
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  tipsList: {
    gap: 6,
  },
  tipText: {
    color: "#D1D5DB",
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
    backgroundColor: "white",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
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
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#374151",
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
  },
  modalButtonPrimary: {
    backgroundColor: "#FF6B35",
  },
  modalButtonPressed: {
    backgroundColor: "#E55A28",
  },
  modalButtonSecondary: {
    backgroundColor: "#E5E7EB",
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
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "600",
  },
});
