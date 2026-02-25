import { brandsApi, categoriesApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

const CATEGORY_ICONS: Record<string, string> = {
  "fruits & vegetables": "https://cdn-icons-png.flaticon.com/128/695/695296.png",
  "dairy & eggs": "https://cdn-icons-png.flaticon.com/128/695/695353.png",
  "bakery": "https://cdn-icons-png.flaticon.com/128/695/695333.png",
  "meat & seafood": "https://cdn-icons-png.flaticon.com/128/2893/2893322.png",
  "beverages": "https://cdn-icons-png.flaticon.com/128/2893/2893321.png",
  "snacks": "https://cdn-icons-png.flaticon.com/128/695/695270.png",
  "frozen foods": "https://cdn-icons-png.flaticon.com/128/695/695350.png",
  "pantry": "https://cdn-icons-png.flaticon.com/128/2893/2893346.png",
  "household": "https://cdn-icons-png.flaticon.com/128/695/695304.png",
};

const getCategoryIcon = (name: string): string | null => {
  const lowerName = name?.toLowerCase() || "";
  // Check for exact match or contains
  for (const [key, url] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName === key || lowerName.includes(key.split(' ')[0])) {
      return url;
    }
  }
  return null;
};

export default function ExploreScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  const router = useRouter();

  const { tab } = useLocalSearchParams<{ tab: string }>();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>((tab as any) || 'categories');

  useEffect(() => {
    if (tab === 'brands' || tab === 'categories') {
      setActiveTab(tab as any);
    }
  }, [tab]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, brandsRes] = await Promise.all([
        categoriesApi.getAll(),
        brandsApi.getAll()
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    } catch (error) {
      console.error("Error fetching explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.categoryCard}
      onPress={() => router.push(`/category/${item.id}` as any)}
    >
      <View style={[styles.iconCircle, { backgroundColor: isDark ? "#1F2937" : "#F3F4F6" }]}>
        {(item.image_url || getCategoryIcon(item.name)) ? (
          <Image
            source={{ uri: item.image_url || getCategoryIcon(item.name) }}
            style={styles.categoryIconImage}
            contentFit="contain"
          />
        ) : (
          <Ionicons name="grid-outline" size={32} color="#2D6A4F" />
        )}
      </View>
      <Text style={styles.cardText}>{item.name}</Text>
    </Pressable>
  );

  const renderBrandItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.brandCard}
      onPress={() => router.push(`/brand/${item.id}` as any)}
    >
      <View style={styles.brandImageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.brandImage} />
        ) : (
          <Ionicons name="business-outline" size={40} color="#ccc" />
        )}
      </View>
      <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Categories</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'brands' && styles.activeTab]}
          onPress={() => setActiveTab('brands')}
        >
          <Text style={[styles.tabText, activeTab === 'brands' && styles.activeTabText]}>Brands</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      ) : (
        <FlatList
          key={activeTab} // Force re-render when switching tabs to reset numColumns
          data={activeTab === 'categories' ? categories : brands}
          renderItem={activeTab === 'categories' ? renderCategoryItem : renderBrandItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={activeTab === 'categories' ? 3 : 2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No {activeTab} found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: isDark ? "#F9FAFB" : "#1F2937",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderWidth: 1,
    borderColor: isDark ? "#374151" : "#E5E7EB",
  },
  activeTab: {
    backgroundColor: "#2D6A4F",
    borderColor: "#2D6A4F",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: isDark ? "#9CA3AF" : "#6B7280",
  },
  activeTabText: {
    color: "#fff",
  },
  list: {
    padding: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  categoryCard: {
    flex: 1,
    maxWidth: (width - 40) / 3,
    alignItems: "center",
    marginBottom: 20,
    padding: 8,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  brandCard: {
    flex: 1,
    width: (width - 40) / 2,
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 16,
    padding: 16,
    margin: 6,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  brandImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    resizeMode: "contain",
  },
  cardText: {
    fontSize: 14,
    fontWeight: "600",
    color: isDark ? "#F9FAFB" : "#1F2937",
    textAlign: "center",
  },
  emptyText: {
    color: isDark ? "#9CA3AF" : "#6B7280",
    fontSize: 16,
  }
});
