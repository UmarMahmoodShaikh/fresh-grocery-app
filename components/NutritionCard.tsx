import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

interface NutritionInfo {
  calories?: number;
  fat?: number;
  saturated_fat?: number;
  trans_fat?: number;
  carbs?: number;
  sugars?: number;
  starch?: number;
  protein?: number;
  sodium?: number;
  salt?: number;
  fiber?: number;
  calcium?: number;
  iron?: number;
  [key: string]: number | undefined;
}

// Daily Reference Values
const DRV = {
  calories: 2000,
  fat: 78,
  saturated_fat: 20,
  trans_fat: 2,
  carbs: 275,
  sugars: 50,
  starch: 150,
  protein: 50,
  sodium: 2300,
  salt: 6,
  fiber: 28,
  calcium: 1000,
  iron: 18,
};

// Calculate percentage of Daily Reference Value
const getPercentageOfDRV = (value: number | undefined, nutrient: string): number | null => {
  if (!value || !DRV[nutrient as keyof typeof DRV]) return null;
  return Math.round((value / DRV[nutrient as keyof typeof DRV]) * 100);
};

// Get percentage color based on value
const getPercentageColor = (percentage: number): string => {
  if (percentage >= 100) return "#EF4444"; // Red - exceeded
  if (percentage >= 75) return "#F97316"; // Orange - approaching
  if (percentage >= 50) return "#FBBF24"; // Yellow - moderate
  return "#10B981"; // Green - low
};

// Calculate health score
const calculateHealthScore = (nutrition: NutritionInfo): number => {
  let score = 100;

  // Deduct points for unhealthy nutrients
  if (nutrition.sugars && nutrition.sugars > 25) score -= 15;
  else if (nutrition.sugars && nutrition.sugars > 12) score -= 8;

  if (nutrition.sodium && nutrition.sodium > 500) score -= 15;
  else if (nutrition.sodium && nutrition.sodium > 300) score -= 8;

  if (nutrition.fat && nutrition.fat > 20) score -= 10;
  else if (nutrition.fat && nutrition.fat > 10) score -= 5;

  if (nutrition.saturated_fat && nutrition.saturated_fat > 5) score -= 8;

  if (nutrition.calories && nutrition.calories > 400) score -= 10;
  else if (nutrition.calories && nutrition.calories > 250) score -= 5;

  // Add points for healthy nutrients
  if (nutrition.fiber && nutrition.fiber > 3) score += 10;
  if (nutrition.protein && nutrition.protein > 8) score += 5;

  return Math.max(0, Math.min(100, score));
};

// Get health score label
const getScoreLabel = (score: number): string => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Bad";
};

// Get score color
const getScoreColor = (score: number): string => {
  if (score >= 80) return "#10B981"; // Green
  if (score >= 60) return "#84CC16"; // Light green
  if (score >= 40) return "#FBBF24"; // Orange
  if (score >= 20) return "#F97316"; // Dark orange
  return "#EF4444"; // Red
};

// Nutrient card component props
interface NutrientCardProps {
  label: string;
  value: number | undefined;
  unit: string;
  icon: string;
  drvKey: keyof typeof DRV;
  isDark: boolean;
  isBad: boolean;
}

const NutrientCard: React.FC<NutrientCardProps> = ({
  label,
  value,
  unit,
  icon,
  drvKey,
  isDark,
  isBad,
}) => {
  if (value === undefined || value === null) return null;

  const percentage = getPercentageOfDRV(value, drvKey);
  const percentColor = percentage ? getPercentageColor(percentage) : "#9CA3AF";

  return (
    <View
      style={[
        styles.nutrientCard,
        {
          backgroundColor: isDark ? "#374151" : "#F9FAFB",
        },
      ]}
    >
      <View style={styles.nutrientHeader}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isBad
                ? isDark
                  ? "#7F1D1D"
                  : "#FEE2E2"
                : isDark
                ? "#064E3B"
                : "#ECFDF5",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={isBad ? "#EF4444" : "#10B981"}
          />
        </View>
        <View style={styles.nutrientLabelContainer}>
          <Text
            style={[
              styles.nutrientLabel,
              { color: isDark ? "#F3F4F6" : "#1F2937" },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.nutrientValue,
              { color: isBad ? "#EF4444" : isDark ? "#D1D5DB" : "#6B7280" },
            ]}
          >
            {`${value.toFixed(1)} ${unit}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const NutritionCard: React.FC<{
  nutrition: NutritionInfo;
  productName?: string;
}> = ({ nutrition, productName = "Product" }) => {
  const isDark = useColorScheme() === "dark";

  const score = calculateHealthScore(nutrition);
  const scoreLabel = getScoreLabel(score);
  const scoreColor = getScoreColor(score);

  // Categorize nutrients
  const mainNutrients = [
    { key: "calories", label: "Energy", icon: "fire", unit: "Cal", isBad: nutrition.calories ? nutrition.calories > 400 : false },
    { key: "fat", label: "Fat", icon: "water", unit: "g", isBad: nutrition.fat ? nutrition.fat > 20 : false },
    { key: "carbs", label: "Carbs", icon: "cube", unit: "g", isBad: nutrition.carbs ? nutrition.carbs > 60 : false },
    { key: "protein", label: "Protein", icon: "fish", unit: "g", isBad: nutrition.protein ? nutrition.protein < 5 : false },
  ];

  const secondaryNutrients = [
    { key: "sugars", label: "Sugars", icon: "cupcake", unit: "g", isBad: nutrition.sugars ? nutrition.sugars > 25 : false },
    { key: "sodium", label: "Sodium", icon: "shaker", unit: "mg", isBad: nutrition.sodium ? nutrition.sodium > 500 : false },
    { key: "fiber", label: "Fiber", icon: "leaf", unit: "g", isBad: nutrition.fiber ? nutrition.fiber < 3 : false },
    { key: "saturated_fat", label: "Saturated Fat", icon: "water-alert", unit: "g", isBad: nutrition.saturated_fat ? nutrition.saturated_fat > 5 : false },
    { key: "trans_fat", label: "Trans Fat", icon: "alert-circle", unit: "g", isBad: nutrition.trans_fat ? nutrition.trans_fat > 0.5 : false },
    { key: "salt", label: "Salt", icon: "shaker-outline", unit: "g", isBad: nutrition.salt ? nutrition.salt > 2 : false },
    { key: "calcium", label: "Calcium", icon: "bone", unit: "mg", isBad: nutrition.calcium ? nutrition.calcium < 100 : false },
    { key: "iron", label: "Iron", icon: "water-opacity", unit: "mg", isBad: nutrition.iron ? nutrition.iron < 2 : false },
    { key: "starch", label: "Starch", icon: "wheat", unit: "g", isBad: nutrition.starch ? nutrition.starch > 50 : false },
  ];

  const allNutrients = [...mainNutrients, ...secondaryNutrients];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
      {/* Score Card */}
      <View
        style={[
          styles.scoreCard,
          { backgroundColor: isDark ? "#111827" : "#F9FAFB" },
        ]}
      >
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>
            {score}
          </Text>
          <Text style={[styles.scoreTotal, { color: isDark ? "#D1D5DB" : "#6B7280" }]}>
            /100
          </Text>
        </View>
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreLabel, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
            {scoreLabel}
          </Text>
        </View>
      </View>

      {/* Nutrients Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Nutrients
        </Text>
        <View style={styles.nutrientsGrid}>
          {allNutrients.map((nutrient) => (
            <NutrientCard
              key={nutrient.key}
              label={nutrient.label}
              value={nutrition[nutrient.key as keyof NutritionInfo] as number}
              unit={nutrient.unit}
              icon={nutrient.icon}
              drvKey={nutrient.key as keyof typeof DRV}
              isDark={isDark}
              isBad={nutrient.isBad}
            />
          ))}
        </View>
      </View>

      {/* Description Card */}
      <View style={[styles.descriptionCard, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
        <Text style={[styles.descriptionText, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
          {score >= 80
            ? "Excellent nutritional value"
            : score >= 60
            ? "Good nutritional choice"
            : score >= 40
            ? "Average nutritional value"
            : score >= 20
            ? "Poor nutritional choice"
            : "Very unhealthy"}
        </Text>
      </View>

      {/* DRV Reference Information */}
      <View
        style={[
          styles.drvInfo,
          { backgroundColor: isDark ? "#374151" : "#F0F9FF" },
        ]}
      >
        <View style={styles.drvIconContainer}>
          <MaterialCommunityIcons
            name="information-outline"
            size={20}
            color="#3B82F6"
          />
        </View>
        <Text
          style={[
            styles.drvText,
            { color: isDark ? "#D1D5DB" : "#1E40AF" },
          ]}
        >
          Values based on a 2,000 Cal/day diet. Your needs may vary.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: "bold",
  },
  scoreTotal: {
    fontSize: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  descriptionCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  nutrientsGrid: {
    gap: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nutrientCard: {
    width: "100%",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nutrientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  nutrientLabelContainer: {
    flex: 1,
  },
  nutrientLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  nutrientValue: {
    fontSize: 12,
  },
  nutrientProgress: {
    gap: 6,
  },
  drvBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  drvFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentage: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  drvInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  drvIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  drvText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default NutritionCard;
