import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProductDetails(id);
    }
  }, [id]);

  const fetchProductDetails = async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);
      // In a real app with a backend, we would hit our own API here.
      // For now, we simulate the backend by falling back to Open Food Facts.
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        setProduct(data.product);
      } else {
        setError("Detailed product information is not available.");
      }
    } catch (err) {
      setError(
        "Failed to fetch product details. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
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

  // Clean up categories
  const categories = product.categories
    ? product.categories.split(",").map((c: string) => c.trim())
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.product_name || "Product Details"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
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

        {/* Product Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.productName}>
            {product.product_name || "Unknown Product"}
          </Text>
          <Text style={styles.productBrand}>
            {product.brands || "Unknown Brand"}
          </Text>

          <View style={styles.badgesContainer}>
            {product.nutriscore_grade && (
              <View style={[styles.badge, { backgroundColor: "#10B981" }]}>
                <Text style={styles.badgeText}>
                  Nutriscore: {product.nutriscore_grade.toUpperCase()}
                </Text>
              </View>
            )}
            {product.nova_group && (
              <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
                <Text style={styles.badgeText}>NOVA: {product.nova_group}</Text>
              </View>
            )}
            {product.ecoscore_grade && product.ecoscore_grade !== "unknown" && (
              <View style={[styles.badge, { backgroundColor: "#3B82F6" }]}>
                <Text style={styles.badgeText}>
                  Eco: {product.ecoscore_grade.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.addToCartButton}>
              <Ionicons name="cart-outline" size={24} color="white" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </Pressable>
          </View>
        </View>

        {/* Extended Details (Backend Simulation) */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>Barcode: {id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              Quantity: {product.quantity || "N/A"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color="#6B7280" />
            <Text style={styles.detailText}>
              Packaging: {product.packaging || "N/A"}
            </Text>
          </View>
        </View>

        {/* Ingredients */}
        {product.ingredients_text && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.paragraphText}>{product.ingredients_text}</Text>
          </View>
        )}

        {/* Categories */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4B5563",
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 24,
  },
  backButtonLarge: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    backgroundColor: "white",
    width: "100%",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
  },
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FF6B35",
    height: 54,
    borderRadius: 27, // Pill shape
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCartText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  detailsSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#4B5563",
    flex: 1,
  },
  paragraphText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#4B5563",
  },
});
