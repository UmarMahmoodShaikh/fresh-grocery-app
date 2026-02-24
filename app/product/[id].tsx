import { BasketLoader } from "@/components/BasketLoader";
import { useCart } from "@/context/CartContext";
import { productsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const FloatingPlusOne = ({ x, y }: { x: number; y: number }) => {
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: y - 20,
        left: x - 15,
        transform: [{ translateY }],
        opacity,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Text style={{ color: "#2D6A4F", fontSize: 24, fontWeight: "bold", textShadowColor: "rgba(255,255,255,0.8)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }}>
        +1
      </Text>
    </Animated.View>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionData {
  energy?: number | string;
  fat?: number | string;
  carbs?: number | string;
  sugars?: number | string;
  proteins?: number | string;
  [key: string]: number | string | undefined;
}

interface DbProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  stock_label?: string;
  barcode?: string;
  image_url?: string;
  nutrition?: NutritionData | string | null;
  category?: { id: number; name: string; image_url?: string };
  brand?: { id: number; name: string; image_url?: string };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductDetails() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { addToCart } = useCart();
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [offProduct, setOffProduct] = useState<any>(null); // Open Food Facts fallback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plusAnimations, setPlusAnimations] = useState<{ id: string; x: number; y: number }[]>([]);

  const handleAddCart = (e: any, item: any) => {
    e.stopPropagation?.();
    if (e.nativeEvent) {
      const { pageX, pageY } = e.nativeEvent;
      const animId = Math.random().toString();
      setPlusAnimations((prev) => [...prev, { id: animId, x: pageX, y: pageY }]);
      setTimeout(() => {
        setPlusAnimations((prev) => prev.filter((a) => a.id !== animId));
      }, 800);
    }
    addToCart(item);
  };

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (rawId: string) => {
    setLoading(true);
    setError(null);

    // ── 1. Try our backend first ─────────────────────────────────────────────
    // objectID from Algolia equals the database product ID (integer)
    const numericId = parseInt(rawId, 10);
    if (!isNaN(numericId)) {
      const result = await productsApi.getById(numericId);
      if (result.data && !result.error) {
        setProduct(result.data as DbProduct);
        setLoading(false);
        return;
      }
    }

    // ── 2. Treat rawId as a barcode → Open Food Facts fallback ───────────────
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${rawId}.json`,
      );
      const data = await response.json();
      if (data.status === 1 && data.product) {
        setOffProduct(data.product);
      } else {
        setError("Product not found in our store or Open Food Facts.");
      }
    } catch {
      setError("Failed to load product. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <BasketLoader text="Loading product details..." />
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || (!product && !offProduct)) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
        <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Render from DB product ─────────────────────────────────────────────────

  if (product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image */}
          <View style={styles.imageContainer}>
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.productImagePlaceholder}>
                <Ionicons name="image-outline" size={60} color="#9CA3AF" />
              </View>
            )}
          </View>

          {/* Core Info */}
          <View style={styles.infoSection}>
            <Text style={styles.productName}>{product.name}</Text>

            {product.brand && (
              <Text style={styles.productBrand}>{product.brand.name}</Text>
            )}

            {/* Price & Stock badges */}
            <View style={styles.badgesContainer}>
              <View style={[styles.badge, { backgroundColor: "#2D6A4F" }]}>
                <Text style={styles.badgeText}>
                  €{Number(product.price).toFixed(2)}
                </Text>
              </View>
              {product.stock_label && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        product.stock > 0 ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  <Text style={styles.badgeText}>{product.stock_label}</Text>
                </View>
              )}
              {product.category && (
                <View style={[styles.badge, { backgroundColor: "#6366F1" }]}>
                  <Text style={styles.badgeText}>{product.category.name}</Text>
                </View>
              )}
            </View>

            {/* Add to cart */}
            <TouchableOpacity style={styles.addToCartButton} onPress={(e) => handleAddCart(e, product)}>
              <Ionicons name="cart-outline" size={22} color="white" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          {product.description ? (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.paragraphText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Nutrition — handles both jsonb objects and plain strings */}
          {product.nutrition ? (
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Nutrition</Text>
              {typeof product.nutrition === "object" && product.nutrition !== null ? (
                <View style={styles.nutritionGrid}>
                  {Object.entries(product.nutrition as Record<string, any>).map(
                    ([key, value]) => (
                      <View key={key} style={styles.nutritionCell}>
                        <Text style={styles.nutritionKey}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                        <Text style={styles.nutritionValue}>
                          {String(value ?? "—")}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              ) : (
                <Text style={styles.paragraphText}>
                  {String(product.nutrition)}
                </Text>
              )}
            </View>
          ) : null}

          {/* Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Details</Text>
            {product.barcode ? (
              <View style={styles.detailRow}>
                <Ionicons name="barcode-outline" size={20} color="#6B7280" />
                <Text style={styles.detailText}>Barcode: {product.barcode}</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>
                Stock: {product.stock} unit{product.stock !== 1 ? "s" : ""}
              </Text>
            </View>
            {product.brand && (
              <View style={styles.detailRow}>
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <Text style={styles.detailText}>Brand: {product.brand.name}</Text>
              </View>
            )}
          </View>
        </ScrollView>
        {/* Render floating +1 animations globally */}
        {plusAnimations.map((anim) => (
          <FloatingPlusOne key={anim.id} x={anim.x} y={anim.y} />
        ))}
      </SafeAreaView>
    );
  }

  // ── Render from Open Food Facts fallback ───────────────────────────────────

  const off = offProduct;
  const categories = off.categories
    ? off.categories.split(",").map((c: string) => c.trim())
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {off.product_name || "Product Details"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          {off.image_url ? (
            <Image
              source={{ uri: off.image_url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={60} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.productName}>
            {off.product_name || "Unknown Product"}
          </Text>
          <Text style={styles.productBrand}>
            {off.brands || "Unknown Brand"}
          </Text>

          <View style={styles.badgesContainer}>
            {off.nutriscore_grade && (
              <View style={[styles.badge, { backgroundColor: "#10B981" }]}>
                <Text style={styles.badgeText}>
                  Nutriscore: {off.nutriscore_grade.toUpperCase()}
                </Text>
              </View>
            )}
            {off.nova_group && (
              <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.badgeText}>NOVA: {off.nova_group}</Text>
              </View>
            )}
            {off.ecoscore_grade && off.ecoscore_grade !== "unknown" && (
              <View style={[styles.badge, { backgroundColor: "#3B82F6" }]}>
                <Text style={styles.badgeText}>
                  Eco: {off.ecoscore_grade.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.addToCartButton} onPress={(e) => handleAddCart(e, offProduct)}>
            <Ionicons name="cart-outline" size={22} color="white" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Barcode: {id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Quantity: {off.quantity || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Packaging: {off.packaging || "N/A"}</Text>
          </View>
        </View>

        {off.ingredients_text && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.paragraphText}>{off.ingredients_text}</Text>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.tagsContainer}>
              {categories.map((cat: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>
                    {cat.replace(/^en:/, "").replace(/^fr:/, "")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Render floating +1 animations globally */}
      {plusAnimations.map((anim) => (
        <FloatingPlusOne key={anim.id} x={anim.x} y={anim.y} />
      ))}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
  centerContainer: {
    flex: 1,
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: isDark ? "#F9FAFB" : "#1F2937",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#374151" : "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? "#111827" : "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#F9FAFB" : "#1F2937",
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 40 },
  imageContainer: {
    backgroundColor: "white",
    width: "100%",
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productImage: { width: "100%", height: "100%" },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? "#111827" : "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: { backgroundColor: "white", padding: 20, marginBottom: 8 },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: isDark ? "#F9FAFB" : "#1F2937",
    marginBottom: 4,
  },
  productBrand: { fontSize: 16, color: isDark ? "#9CA3AF" : "#6B7280", marginBottom: 16 },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#2D6A4F",
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartText: { color: "white", fontSize: 17, fontWeight: "bold" },
  detailsSection: { backgroundColor: "white", padding: 20, marginBottom: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: isDark ? "#F9FAFB" : "#1F2937",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  detailText: { fontSize: 15, color: isDark ? "#D1D5DB" : "#4B5563", flex: 1 },
  paragraphText: { fontSize: 15, color: isDark ? "#D1D5DB" : "#4B5563", lineHeight: 24 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: isDark ? "#111827" : "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 14, color: isDark ? "#D1D5DB" : "#4B5563" },
  // Nutrition grid
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nutritionCell: {
    width: "47%",
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: isDark ? "#374151" : "#E5E7EB",
  },
  nutritionKey: {
    fontSize: 11,
    fontWeight: "600",
    color: isDark ? "#D1D5DB" : "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "700",
    color: isDark ? "#F9FAFB" : "#111827",
  },
});
