import { useCart } from "@/context/CartContext";
import { productsApiV2 } from "@/services/api";
import { searchClient } from "@/services/algolia";
import { useStore } from "@/context/StoreContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Scanner() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const isFocused = useIsFocused();

  const router = useRouter();
  const { addToCart } = useCart();
  const { selectedStore } = useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [internalProduct, setInternalProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [resultData, setResultData] = useState({
    title: "",
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const resetState = () => {
    setResultVisible(false);
    setScanned(false);
    setLoading(false);
    setInternalProduct(null);
    setSimilarProducts([]);
  };

  useEffect(() => {
    if (!isFocused) {
      resetState();
    }
  }, [isFocused]);

  const fetchSimilarFromAlgolia = async (product: any) => {
    if (!product?.category?.name) return;
    setLoadingSimilar(true);
    try {
      const results = await searchClient.searchSingleIndex({
        indexName: "Product",
        searchParams: {
          query: product.category.name,
          hitsPerPage: 6,
          filters: `NOT objectID:${product.id}`,
        },
      });
      const hits = (results as any).hits || [];
      const filtered = hits.filter(
        (h: any) => h.brand?.name !== product.brand?.name
      );
      setSimilarProducts(filtered.slice(0, 5));
    } catch {
      // Fallback to backend API
      try {
        if (selectedStore && product.category?.id) {
          const res = await productsApiV2.getByCategory(selectedStore.slug, product.category.id);
          const all = Array.isArray(res.data) ? res.data : (res.data as any)?.products || [];
          const filtered = all.filter(
            (p: any) => p.id !== product.id && p.brand?.id !== product.brand?.id
          );
          setSimilarProducts(filtered.slice(0, 5));
        }
      } catch {}
    } finally {
      setLoadingSimilar(false);
    }
  };

  const fetchProductData = async (barcode: string) => {
    try {
      setLoading(true);

      if (!selectedStore) {
        setResultData({
          title: "⚠️ No Store Selected",
          message: "Please select a store from the Home screen before scanning products.",
          type: "warning",
        });
        setResultVisible(true);
        setLoading(false);
        return;
      }

      // 1. Check local cache FIRST (for instant offline scanning)
      const { productCacheService } = await import("@/services/productCache");
      let internalProd = await productCacheService.getCachedProductByBarcode(selectedStore.slug, barcode);

      // 2. If not in cache, try fetching from internal API
      if (!internalProd) {
        try {
          const internalCheck = await productsApiV2.getByBarcode(selectedStore.slug, barcode);
          internalProd = internalCheck.data;
        } catch (e) {
          console.warn("Failed to fetch from internal API", e);
        }
      }

      // If it exists in our store (from cache or API), show options to add to cart!
      if (internalProd) {
        setInternalProduct(internalProd);

        let nutDetails = "";
        try {
          if (internalProd.nutrition) {
            const nut = typeof internalProd.nutrition === "string"
              ? JSON.parse(internalProd.nutrition)
              : internalProd.nutrition;
            if (nut.calories || nut.protein || nut.fat || nut.carbohydrates) {
              nutDetails = `\n\n🥗 Nutrition Facts:\nCalories: ${nut.calories || 0} kcal\nProtein: ${nut.protein || 0}g\nFat: ${nut.fat || 0}g\nCarbs: ${nut.carbohydrates || 0}g`;
            }
          }
        } catch (e) {}

        const description = internalProd.description
          ? `\n\n📝 Details:\n${internalProd.description}`
          : "";
          
        const price = Number(internalProd.discount_price || internalProd.price).toFixed(2);

        setResultData({
          title: "✅ Product Found in Store!",
          message: `${internalProd.name}\n\n🏷️ Brand: ${internalProd.brand?.name || "N/A"}\n📦 Category: ${internalProd.category?.name || "N/A"}\n💰 Price: €${price}${nutDetails}${description}`,
          type: "success",
        });
        setResultVisible(true);
        setLoading(false);
        fetchSimilarFromAlgolia(internalProd);
        return;
      }

      // 3. If not in our store, try external fallback (Open Food Facts)
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const categories = product.categories
          ? product.categories.split(",").slice(0, 2).join(", ")
          : "N/A";

        const externalMapped = {
          id: null,
          name: product.product_name || "Unknown Product",
          image_url: product.image_url || null,
          brand: { name: product.brands || "N/A" },
          category: { name: categories },
          price: 0,
          stock: 0,
          description: "⚠️ Recognized internationally but not carried in this store.",
        };

        setInternalProduct(externalMapped);
        setResultData({
          title: "❌ Not in This Store",
          message: externalMapped.description,
          type: "warning",
        });
        setResultVisible(true);
        setLoading(false);
        return;
      } else {
        setResultData({
          title: "❌ Product Not Found",
          message: `Barcode (${barcode}) is unknown.\n\n• May be a non-food product\n• Or an invalid barcode`,
          type: "error",
        });
        setResultVisible(true);
      }
    } catch {
      setResultData({
        title: "⚠️ Connection Error",
        message: "Unable to fetch product data. Check your internet connection.",
        type: "warning",
      });
      setResultVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: any) => {
    if (scanned || loading) return;
    setScanned(true);
    if (!data || data.trim().length === 0) {
      setResultData({
        title: "❌ Invalid Barcode",
        message: "The scanned barcode is empty or unreadable. Please try again.",
        type: "error",
      });
      setResultVisible(true);
      return;
    }
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
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={styles.backButton}
            onPress={() => { setScanned(false); setLoading(false); router.push("/(tabs)"); }}
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
          onPress={() => { setScanned(false); setLoading(false); router.push("/(tabs)"); }}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "#111827"} />
        </Pressable>
        <Text style={styles.headerTitle}>Scan Product</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        {isFocused ? (
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
            }}
          >
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
          </CameraView>
        ) : (
          <View style={[styles.camera, styles.cameraPaused]}>
            <Ionicons name="camera-off-outline" size={52} color="#6B7280" />
            <Text style={styles.cameraPausedText}>Camera paused</Text>
          </View>
        )}
      </View>

      <Text style={styles.instructionText}>Position the barcode within the frame</Text>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Text style={styles.overlayLoadingText}>🔍 Fetching product data...</Text>
          </View>
        </View>
      )}

      {/* Tips */}
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

      {/* Result Bottom Sheet */}
      <Modal
        visible={resultVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={resetState}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.dragHandle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {internalProduct ? (
                <>
                  {/* Product Image */}
                  <View style={styles.productImageContainer}>
                    {internalProduct.image_url ? (
                      <Image
                        source={{ uri: internalProduct.image_url }}
                        style={styles.productImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={[
                      styles.stockBadge,
                      { backgroundColor: internalProduct.stock > 0 ? "#D1FAE5" : "#FEE2E2" }
                    ]}>
                      <Text style={[
                        styles.stockBadgeText,
                        { color: internalProduct.stock > 0 ? "#065F46" : "#991B1B" }
                      ]}>
                        {internalProduct.stock > 0 ? "✓ In Stock" : "Out of Stock"}
                      </Text>
                    </View>
                  </View>

                  {/* Product Info */}
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: isDark ? "#F9FAFB" : "#111827" }]}>
                      {internalProduct.name}
                    </Text>
                    {internalProduct.brand?.name && (
                      <Text style={styles.productBrand}>{internalProduct.brand.name}</Text>
                    )}
                    <View style={styles.productMeta}>
                      {internalProduct.category?.name && (
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>{internalProduct.category.name}</Text>
                        </View>
                      )}
                      {internalProduct.weight && (
                        <View style={[styles.metaBadge, { backgroundColor: isDark ? "#374151" : "#F3F4F6" }]}>
                          <Text style={[styles.metaBadgeText, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
                            {internalProduct.weight}{internalProduct.weight_unit || ""}
                          </Text>
                        </View>
                      )}
                    </View>
                    {internalProduct.price > 0 && (
                      <Text style={styles.productPrice}>
                        €{Number(internalProduct.discount_price || internalProduct.price).toFixed(2)}
                      </Text>
                    )}
                  </View>

                  {/* Add to Cart */}
                  <View style={styles.actionRow}>
                    <Pressable
                      disabled={internalProduct.stock <= 0}
                      style={[styles.btnPrimary, internalProduct.stock <= 0 && { backgroundColor: "#9CA3AF" }]}
                      onPress={async () => {
                        await addToCart(internalProduct);
                        resetState();
                      }}
                    >
                      <Ionicons name="cart-outline" size={18} color="white" />
                      <Text style={styles.btnPrimaryText}>
                        {internalProduct.stock > 0 ? "Add to Cart" : "Out of Stock"}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.secondaryRow}>
                    {internalProduct.id && (
                      <Pressable
                        style={styles.btnSecondary}
                        onPress={() => {
                          const id = internalProduct.id;
                          resetState();
                          router.push(`/product/${id}` as any);
                        }}
                      >
                        <Ionicons name="information-circle-outline" size={16} color={isDark ? "#F9FAFB" : "#374151"} />
                        <Text style={[styles.btnSecondaryText, { color: isDark ? "#F9FAFB" : "#374151" }]}>
                          View Details
                        </Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.btnSecondary} onPress={resetState}>
                      <Ionicons name="scan-outline" size={16} color={isDark ? "#F9FAFB" : "#374151"} />
                      <Text style={[styles.btnSecondaryText, { color: isDark ? "#F9FAFB" : "#374151" }]}>
                        Next Product
                      </Text>
                    </Pressable>
                  </View>

                  {/* Similar Products */}
                  {(loadingSimilar || similarProducts.length > 0) && (
                    <View style={styles.similarSection}>
                      <Text style={[styles.similarTitle, { color: isDark ? "#F9FAFB" : "#111827" }]}>
                        {internalProduct.category?.name
                          ? `Other ${internalProduct.category.name} options`
                          : "Similar Products"}
                      </Text>
                      {loadingSimilar ? (
                        <ActivityIndicator color="#2D6A4F" style={{ marginVertical: 12 }} />
                      ) : (
                        <FlatList
                          data={similarProducts}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          keyExtractor={(item) => (item.objectID || item.id || Math.random()).toString()}
                          contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[styles.similarCard, { backgroundColor: isDark ? "#374151" : "#F9FAFB" }]}
                              onPress={() => {
                                const pid = item.objectID || item.id;
                                resetState();
                                router.push(`/product/${pid}` as any);
                              }}
                            >
                              {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={styles.similarImage} resizeMode="contain" />
                              ) : (
                                <View style={[styles.similarImage, { alignItems: "center", justifyContent: "center" }]}>
                                  <Ionicons name="image-outline" size={28} color="#9CA3AF" />
                                </View>
                              )}
                              <Text style={[styles.similarName, { color: isDark ? "#F9FAFB" : "#111827" }]} numberOfLines={2}>
                                {item.name}
                              </Text>
                              {item.brand?.name && (
                                <Text style={styles.similarBrand} numberOfLines={1}>{item.brand.name}</Text>
                              )}
                              <Text style={styles.similarPrice}>
                                €{Number(item.price || 0).toFixed(2)}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <Ionicons
                      name={resultData.type === "error" ? "close-circle" : "alert-circle"}
                      size={52}
                      color={resultData.type === "error" ? "#EF4444" : "#F59E0B"}
                    />
                    <Text style={[styles.productName, { color: isDark ? "#F9FAFB" : "#111827", marginTop: 12, textAlign: "center" }]}>
                      {resultData.title}
                    </Text>
                    <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280", marginTop: 8, textAlign: "center", lineHeight: 22 }}>
                      {resultData.message}
                    </Text>
                  </View>
                  <Pressable style={styles.btnPrimary} onPress={resetState}>
                    <Ionicons name="scan-outline" size={18} color="white" />
                    <Text style={styles.btnPrimaryText}>Next Product</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
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
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { color: isDark ? "white" : "#111827", fontSize: 16 },
    permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    permissionTitle: { fontSize: 24, fontWeight: "bold", color: isDark ? "white" : "#111827", marginTop: 20, marginBottom: 10 },
    permissionText: { fontSize: 16, color: isDark ? "#D1D5DB" : "#9CA3AF", textAlign: "center", marginBottom: 30 },
    permissionButton: { backgroundColor: "#2D6A4F", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, marginBottom: 12 },
    permissionButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
    backButton: { paddingHorizontal: 24, paddingVertical: 12 },
    backButtonText: { color: isDark ? "#D1D5DB" : "#9CA3AF", fontSize: 16 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
    headerBackButton: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: isDark ? "white" : "#111827" },
    headerSpacer: { width: 40 },
    cameraContainer: { flex: 1, marginHorizontal: 20, marginTop: 20, borderRadius: 20, overflow: "hidden" },
    camera: { flex: 1 },
    cameraPaused: { alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0F172A" : "#E5E7EB", gap: 12 },
    cameraPausedText: { color: isDark ? "#D1D5DB" : "#6B7280", fontSize: 16, fontWeight: "600" },
    scanFrame: { flex: 1, justifyContent: "center", alignItems: "center" },
    corner: { position: "absolute", width: 60, height: 60, borderColor: "#10B981", borderWidth: 4 },
    cornerTopLeft: { top: "25%", left: "15%", borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
    cornerTopRight: { top: "25%", right: "15%", borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
    cornerBottomLeft: { bottom: "25%", left: "15%", borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
    cornerBottomRight: { bottom: "25%", right: "15%", borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
    instructionText: { color: isDark ? "white" : "#4B5563", fontSize: 16, textAlign: "center", marginTop: 20, marginBottom: 16 },
    tipsCard: { backgroundColor: isDark ? "#1F2937" : "#F3F4F6", marginHorizontal: 20, marginTop: 16, marginBottom: 110, padding: 16, borderRadius: 12 },
    tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    tipsTitle: { color: isDark ? "white" : "#111827", fontSize: 16, fontWeight: "600" },
    tipsList: { gap: 6 },
    tipText: { color: isDark ? "#D1D5DB" : "#4B5563", fontSize: 14 },
    loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    loadingCard: { backgroundColor: isDark ? "#1F2937" : "white", paddingHorizontal: 32, paddingVertical: 24, borderRadius: 16 },
    overlayLoadingText: { fontSize: 16, fontWeight: "600", color: isDark ? "#F9FAFB" : "#1F2937" },
    // Bottom Sheet Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12,
      maxHeight: "88%",
      shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 20,
    },
    dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? "#4B5563" : "#D1D5DB", alignSelf: "center", marginBottom: 16 },
    productImageContainer: { alignItems: "center", marginBottom: 16, position: "relative" },
    productImage: { width: "100%", height: 200, borderRadius: 12 },
    productImagePlaceholder: { width: "100%", height: 160, borderRadius: 12, backgroundColor: isDark ? "#374151" : "#F3F4F6", alignItems: "center", justifyContent: "center" },
    stockBadge: { position: "absolute", top: 8, right: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    stockBadgeText: { fontSize: 12, fontWeight: "700" },
    productInfo: { marginBottom: 16 },
    productName: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
    productBrand: { fontSize: 14, color: "#6B7280", marginBottom: 10 },
    productMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    metaBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    metaBadgeText: { fontSize: 12, fontWeight: "600", color: "#065F46" },
    productPrice: { fontSize: 26, fontWeight: "bold", color: "#2D6A4F" },
    actionRow: { marginBottom: 10 },
    btnPrimary: {
      backgroundColor: "#2D6A4F", flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, paddingVertical: 14, borderRadius: 14,
      shadowColor: "#2D6A4F", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    btnPrimaryText: { color: "white", fontSize: 16, fontWeight: "bold" },
    secondaryRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    btnSecondary: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 6, paddingVertical: 12, borderRadius: 14,
      backgroundColor: isDark ? "#374151" : "#F3F4F6",
      borderWidth: 1, borderColor: isDark ? "#4B5563" : "#E5E7EB",
    },
    btnSecondaryText: { fontSize: 14, fontWeight: "600" },
    similarSection: { marginBottom: 16 },
    similarTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
    similarCard: { width: 130, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: isDark ? "#4B5563" : "#E5E7EB" },
    similarImage: { width: "100%", height: 90, borderRadius: 8, marginBottom: 6 },
    similarName: { fontSize: 12, fontWeight: "600", marginBottom: 2, lineHeight: 16 },
    similarBrand: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
    similarPrice: { fontSize: 13, fontWeight: "bold", color: "#2D6A4F" },
    // keep scan button styles (might be used elsewhere)
    scanButton: { backgroundColor: "#10B981", marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
    scanButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
    barcodeIconContainer: { backgroundColor: "rgba(255,255,255,0.9)", padding: 20, borderRadius: 16 },
  });
