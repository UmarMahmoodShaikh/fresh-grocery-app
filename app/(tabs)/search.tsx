import { Ionicons } from "@expo/vector-icons";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Initialize Algolia search client
const searchClient = algoliasearch(
  "YII8JLZ4WK",
  "096a508298eb0d378badc8857afcdfbf",
);
const INDEX_NAME = "grocery_products";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (text: string) => {
    setQuery(text);

    if (!text.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { results: searchResults } = await searchClient.search({
        requests: [
          {
            indexName: INDEX_NAME,
            query: text,
            hitsPerPage: 10,
          },
        ],
      });

      const hits = (searchResults[0] as any)?.hits || [];
      setResults(hits);
    } catch (error) {
      console.error("Algolia search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);
  // open product page when press on product
  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => router.push(`/product/${item.objectID}` as any)}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="image-outline" size={24} color="#9CA3AF" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name || "Unknown Product"}
        </Text>
        <Text style={styles.productBrand} numberOfLines={1}>
          {item.brand || "Unknown Brand"}
        </Text>
        {item.nutriscore && (
          <Text style={styles.productNutriscore}>
            Nutriscore: {item.nutriscore.toUpperCase()}
          </Text>
        )}
      </View>
      <Pressable style={styles.addButton}>
        <Ionicons name="add" size={20} color="white" />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Search Bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <View style={styles.searchBarContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={performSearch}
            autoFocus={true}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => performSearch("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {isSearching && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2D6A4F" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : query.length > 0 && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find anything matching "{query}"
            </Text>
          </View>
        ) : query.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="basket-outline" size={60} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>What are you looking for?</Text>
            <Text style={styles.emptySubtitle}>
              Search for your favorite groceries, brands, or categories
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.objectID}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#1F2937",
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  productNutriscore: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "500",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
  },
});
