import { brandsApi, categoriesApi } from "@/services/api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CATEGORY_ICONS: Record<string, string> = {
  "fruits & vegetables": "fruit-watermelon",
  "dairy & eggs": "cheese",
  bakery: "baguette",
  "meat & seafood": "food-steak",
  beverages: "cup-water",
  snacks: "cookie",
  "frozen foods": "snowflake",
  pantry: "archive",
  household: "spray-bottle",
};

const getCategoryIcon = (name: string): string | null => {
  const lowerName = name?.toLowerCase() || "";
  for (const [key, iconName] of Object.entries(CATEGORY_ICONS)) {
    if (lowerName === key || lowerName.includes(key.split(" ")[0])) {
      return iconName;
    }
  }
  return null;
};

const getInitials = (name: string) => {
  if (!name) return "";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const CATEGORY_COLORS = [
  { bg: "#FFF3E0", text: "#2D6A4F" },
  { bg: "#E8F5E9", text: "#2D6A4F" },
  { bg: "#E3F2FD", text: "#1976D2" },
  { bg: "#F3E8FF", text: "#7C3AED" },
  { bg: "#FFF8E1", text: "#F59E0B" },
  { bg: "#FCE4EC", text: "#E91E63" },
  { bg: "#E0F7FA", text: "#00ACC1" },
  { bg: "#F9FBE7", text: "#827717" },
  { bg: "#EFEBE9", text: "#5D4037" },
];

export default function ExploreScreen() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const router = useRouter();

  const { tab } = useLocalSearchParams<{ tab: string }>();
  const [activeTab, setActiveTab] = useState<"categories" | "brands">(
    (tab as any) || "categories",
  );

  useEffect(() => {
    if (tab === "brands" || tab === "categories") {
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
        brandsApi.getAll(),
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    } catch (error) {
      console.error("Error fetching explore data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    return (
      <Pressable
        style={styles.categoryCard}
        onPress={() => router.push(`/category/${item.id}` as any)}
      >
        <View style={[styles.iconCircle, { backgroundColor: color.bg }]}>
          {getCategoryIcon(item.name) ? (
            <MaterialCommunityIcons
              name={getCategoryIcon(item.name) as any}
              size={32}
              color={color.text}
            />
          ) : item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.categoryIconImage}
              contentFit="contain"
            />
          ) : (
            <Ionicons name="grid-outline" size={32} color={color.text} />
          )}
        </View>
        <Text style={styles.cardText} numberOfLines={2} adjustsFontSizeToFit>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const renderBrandItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.brandCard}
      onPress={() => router.push(`/brand/${item.id}` as any)}
    >
      <View
        style={[styles.brandImageContainer, { backgroundColor: "#FFF3E0" }]}
      >
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#2D6A4F" }}>
          {getInitials(item.name)}
        </Text>
      </View>
      <Text style={styles.cardText} numberOfLines={1}>
        {item.name}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => setActiveTab("categories")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.activeTabText,
            ]}
          >
            Categories
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "brands" && styles.activeTab]}
          onPress={() => setActiveTab("brands")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "brands" && styles.activeTabText,
            ]}
          >
            Brands
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      ) : (
        <FlatList
          key={activeTab} // Force re-render when switching tabs to reset numColumns
          data={activeTab === "categories" ? categories : brands}
          renderItem={
            activeTab === "categories" ? renderCategoryItem : renderBrandItem
          }
          keyExtractor={(item) => item.id.toString()}
          numColumns={activeTab === "categories" ? 3 : 2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={
            activeTab === "categories"
              ? { justifyContent: "space-evenly" }
              : undefined
          }
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

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
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
      width: (width - 24) / 3,
      alignItems: "center",
      marginBottom: 20,
      paddingHorizontal: 4,
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
      width: (width - 48) / 2, // Accounts for 12 padding list and 6 margin item
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
    },
  });
