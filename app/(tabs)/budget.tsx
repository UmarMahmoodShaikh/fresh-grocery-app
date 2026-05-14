import { BasketLoader } from "@/components/BasketLoader";
import { useBudget } from "@/context/BudgetContext";
import { useCart } from "@/context/CartContext";
import { categoriesApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface Category {
  id: number;
  name: string;
  image_url?: string;
}

const CATEGORY_COLORS = ["#E8F5E9", "#E3F2FD", "#FFF8E1", "#FCE4EC", "#EDE7F6", "#E0F7FA"];

export default function BudgetScreen() {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const styles = getStyles(isDark);
  const { totalBudget, setTotalBudget, setCategoryBudget, clearBudgets, saveBudgets, getCategoryBudget } = useBudget();
  const { cartItems, cartTotal } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await categoriesApi.getAll();
        const data = Array.isArray(result.data)
          ? result.data
          : Array.isArray((result.data as any)?.categories)
            ? (result.data as any).categories
            : [];
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const spentByCategory = (categoryId: number) =>
    cartItems
      .filter((item) => item.category_id === categoryId)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const budgetRemaining = totalBudget > 0 ? totalBudget - cartTotal : 0;

  const handleSaveBudgets = async () => {
    await saveBudgets();
    Alert.alert("Saved", "Your budget settings have been saved.");
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const budget = getCategoryBudget(item.id, item.name);
    const spent = spentByCategory(item.id);
    const remaining = budget > 0 ? budget - spent : 0;
    const accent = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

    return (
      <View key={item.id} style={[styles.categoryCard, { borderColor: accent }]}>
        <View style={[styles.categoryBadge, { backgroundColor: accent }]}>
          <Ionicons name="pricetag-outline" size={20} color={isDark ? "#E5E7EB" : "#374151"} />
        </View>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{item.name}</Text>
          <Text style={styles.categoryMeta}>Spent €{spent.toFixed(2)}</Text>
          <Text style={styles.categoryMeta}>Remaining €{Math.max(remaining, 0).toFixed(2)}</Text>
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Budget</Text>
          <TextInput
            value={budget > 0 ? String(budget) : ""}
            onChangeText={(text) => setCategoryBudget(item.id, item.name, Number(text) || 0)}
            placeholder="0"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom + 120 },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>Set a total budget and per-category limits. You will get an alert when adding items goes over budget.</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total budget</Text>
              <TextInput
                value={totalBudget > 0 ? String(totalBudget) : ""}
                onChangeText={(text) => setTotalBudget(Number(text) || 0)}
                placeholder="0"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                keyboardType="decimal-pad"
                style={styles.totalInput}
              />
            </View>
            <View style={styles.totalStats}>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>€{cartTotal.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statValue, budgetRemaining < 0 && { color: "#DC2626" }]}>
                €{budgetRemaining.toFixed(2)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearBudgets}>
            <Ionicons name="refresh-outline" size={18} color="#DC2626" />
            <Text style={styles.clearButtonText}>Clear all budgets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveBudgets}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Save budgets</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category budgets</Text>
          <Text style={styles.sectionHint}>Based on your existing product categories</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 30 }}>
            <BasketLoader text="Loading categories..." backgroundColor="transparent" />
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={28} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text style={styles.emptyText}>No categories available right now.</Text>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {categories.map((item, index) => renderCategory({ item, index }))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#111827" : "#F8FAFC",
    },
    content: {
      padding: 20,
      gap: 16,
    },
    header: {
      gap: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: isDark ? "#9CA3AF" : "#475569",
    },
    summaryCard: {
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderRadius: 24,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
    },
    summaryLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#64748B",
      marginBottom: 8,
    },
    totalInput: {
      minWidth: 140,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E2E8F0",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
      backgroundColor: isDark ? "#111827" : "#F8FAFC",
    },
    totalStats: {
      alignItems: "flex-end",
      gap: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#64748B",
    },
    statValue: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    clearButton: {
      marginTop: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 12,
      backgroundColor: isDark ? "#111827" : "#FEF2F2",
    },
    clearButtonText: {
      color: "#DC2626",
      fontWeight: "700",
    },
    saveButton: {
      marginTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 14,
      paddingVertical: 12,
      backgroundColor: "#22C55E",
    },
    saveButtonText: {
      color: "#fff",
      fontWeight: "800",
    },
    sectionHeader: {
      gap: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    sectionHint: {
      fontSize: 13,
      color: isDark ? "#9CA3AF" : "#64748B",
    },
    categoryList: {
      gap: 12,
    },
    categoryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderRadius: 20,
      borderWidth: 1,
      padding: 14,
    },
    categoryBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryContent: {
      flex: 1,
      gap: 3,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    categoryMeta: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#64748B",
    },
    inputWrap: {
      alignItems: "flex-end",
      gap: 4,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#64748B",
    },
    input: {
      minWidth: 96,
      borderWidth: 1,
      borderColor: isDark ? "#374151" : "#E2E8F0",
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
      backgroundColor: isDark ? "#111827" : "#F8FAFC",
      textAlign: "right",
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: "center",
      gap: 10,
    },
    emptyText: {
      color: isDark ? "#9CA3AF" : "#64748B",
    },
  });