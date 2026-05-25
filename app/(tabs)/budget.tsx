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
  
  const { 
    profiles, 
    activeProfile, 
    totalBudget, 
    setTotalBudget, 
    setCategoryBudget, 
    clearBudgets, 
    saveBudgets, 
    getCategoryBudget,
    createProfile,
    activateProfile,
    deleteProfile
  } = useBudget();
  
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

  const handleCreateProfile = () => {
    Alert.prompt(
      "New Budget Profile",
      "Enter a name for your new budget profile:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Create", 
          onPress: (name) => {
            if (name && name.trim().length > 0) {
              createProfile(name.trim(), totalBudget);
            }
          }
        }
      ],
      "plain-text"
    );
  };

  const handleDeleteProfile = (id: number, name: string) => {
    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete the profile "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteProfile(id) }
      ]
    );
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget</Text>
        <TouchableOpacity onPress={handleSaveBudgets}>
          <Text style={styles.headerSave}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <View style={styles.profileSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileScroll}>
            {profiles.map(p => (
              <TouchableOpacity 
                key={p.id} 
                style={[styles.profileChip, p.is_active && styles.profileChipActive]}
                onPress={() => activateProfile(p.id)}
                onLongPress={() => handleDeleteProfile(p.id, p.name)}
              >
                <Text style={[styles.profileChipText, p.is_active && styles.profileChipTextActive]}>
                  {p.name}
                </Text>
                {p.is_active && <Ionicons name="checkmark-circle" size={16} color="#22C55E" style={{marginLeft: 4}} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.profileChipNew} onPress={handleCreateProfile}>
              <Ionicons name="add" size={16} color={isDark ? "#9CA3AF" : "#64748B"} />
              <Text style={styles.profileChipNewText}>New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
      {profiles.length === 0 && (
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileChipNew} onPress={handleCreateProfile}>
            <Ionicons name="add" size={16} color={isDark ? "#9CA3AF" : "#64748B"} />
            <Text style={styles.profileChipNewText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom + 120 },
        ]}
      >
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#E5E7EB",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#1F2937",
    },
    headerSave: {
      color: "#22C55E",
      fontWeight: "600",
      fontSize: 16,
    },
    profileSection: {
      paddingVertical: 12,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#E5E7EB",
    },
    profileScroll: {
      paddingHorizontal: 16,
      gap: 8,
    },
    profileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? "#374151" : "#F1F5F9",
      borderWidth: 1,
      borderColor: 'transparent',
    },
    profileChipActive: {
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.1)" : "#DCFCE7",
      borderColor: "#22C55E",
    },
    profileChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#D1D5DB" : "#475569",
    },
    profileChipTextActive: {
      color: "#16A34A",
    },
    profileChipNew: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: isDark ? "#4B5563" : "#CBD5E1",
      backgroundColor: 'transparent',
    },
    profileChipNewText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#64748B",
      marginLeft: 4,
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