import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  energy_kj?: number;
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
  nutriscore?: string;
  novascore?: number;
  ecoscore?: string;
  ingredients_text?: string;
  packaging?: string;
  environment?: string[];
  origins?: string;
  [key: string]: any;
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

const getPercentageOfDRV = (value: number | undefined, nutrient: string): number | null => {
  if (value === undefined || !DRV[nutrient as keyof typeof DRV]) return null;
  return Math.round((value / DRV[nutrient as keyof typeof DRV]) * 100);
};

const getScoreColor = (score: string): string => {
  const s = score.toLowerCase();
  if (s === 'a') return "#038141";
  if (s === 'b') return "#85BB2F";
  if (s === 'c') return "#FECB02";
  if (s === 'd') return "#EE8100";
  return "#E63E11"; // e
};

const NutritionCard: React.FC<{
  nutrition: NutritionInfo;
  productName?: string;
}> = ({ nutrition, productName = "Product" }) => {
  const isDark = useColorScheme() === 'dark';

  const nutriscore = nutrition.nutriscore || 'c';
  const novascore = nutrition.novascore || 1;
  const ecoscore = nutrition.ecoscore || 'b';

  // Define nutrient levels for OpenFoodFacts Traffic Lights style
  const getTrafficLight = (key: string, value: number | undefined) => {
    if (value === undefined) return null;
    if (key === 'fat') {
      return value <= 3.0 
        ? { label: "Matières grasses en faible quantité", color: "#10B981" } 
        : value <= 20.0 ? { label: "Matières grasses en quantité modérée", color: "#FBBF24" } 
        : { label: "Matières grasses en quantité élevée", color: "#EF4444" };
    }
    if (key === 'saturated_fat') {
      return value <= 1.5 
        ? { label: "Acides gras saturés en faible quantité", color: "#10B981" } 
        : value <= 5.0 ? { label: "Acides gras saturés en quantité modérée", color: "#FBBF24" } 
        : { label: "Acides gras saturés en quantité élevée", color: "#EF4444" };
    }
    if (key === 'sugars') {
      return value <= 5.0 
        ? { label: "Sucres en faible quantité", color: "#10B981" } 
        : value <= 12.5 ? { label: "Sucres en quantité modérée", color: "#FBBF24" } 
        : { label: "Sucres en quantité élevée", color: "#EF4444" };
    }
    if (key === 'salt') {
      return value <= 0.3 
        ? { label: "Sel en faible quantité", color: "#10B981" } 
        : value <= 1.5 ? { label: "Sel en quantité modérée", color: "#FBBF24" } 
        : { label: "Sel en quantité élevée", color: "#EF4444" };
    }
    return null;
  };

  const scoreColor = getScoreColor(nutriscore);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#111827" : "#F3F4F6" }]}>
      {/* 1. Correspondance avec vos préférences (Preferences & Scores) */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Correspondance avec vos préférences
        </Text>
        
        <View style={styles.scoreRow}>
          {/* Nutri-Score badge */}
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
            <View style={styles.nutriScoreContainer}>
              {['a', 'b', 'c', 'd', 'e'].map((letter) => {
                const active = letter === nutriscore.toLowerCase();
                const color = getScoreColor(letter);
                return (
                  <View 
                    key={letter} 
                    style={[
                      styles.nutriLetterBox, 
                      active && { backgroundColor: color, borderRadius: 4 }
                    ]}
                  >
                    <Text style={[styles.nutriLetterText, active && styles.nutriLetterTextActive]}>
                      {letter.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.badgeLabel, { color: isDark ? "#D1D5DB" : "#4B5563" }]}>
              Nutri-Score {nutriscore.toUpperCase()}
            </Text>
            <Text style={styles.badgeSub}>Qualité nutritionnelle moyenne</Text>
          </View>

          {/* NOVA Score badge */}
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? "#111827" : "#F9FAFB" }]}>
            <View style={[styles.novaBox, { backgroundColor: novascore === 1 ? "#10B981" : "#F59E0B" }]}>
              <Text style={styles.novaText}>{novascore}</Text>
            </View>
            <Text style={[styles.badgeLabel, { color: isDark ? "#D1D5DB" : "#4B5563" }]}>
              NOVA Group {novascore}
            </Text>
            <Text style={styles.badgeSub}>Aliments peu transformés</Text>
          </View>
        </View>

        <View style={styles.scoreRow}>
          {/* Eco-Score badge */}
          <View style={[styles.scoreBadge, { backgroundColor: isDark ? "#111827" : "#F9FAFB", width: '100%' }]}>
            <View style={styles.ecoRow}>
              <Ionicons name="leaf" size={24} color="#10B981" />
              <View style={[styles.ecoLetterBox, { backgroundColor: getScoreColor(ecoscore) }]}>
                <Text style={styles.ecoLetterText}>{ecoscore.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.badgeLabel, { color: isDark ? "#D1D5DB" : "#4B5563" }]}>
              Green-Score {ecoscore.toUpperCase()}
            </Text>
            <Text style={styles.badgeSub}>Faible impact environnemental</Text>
          </View>
        </View>
      </View>

      {/* 2. Repères nutritionnels (Traffic Lights) */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Repères nutritionnels
        </Text>
        <View style={styles.trafficLightsContainer}>
          {['fat', 'saturated_fat', 'sugars', 'salt'].map((key) => {
            const val = nutrition[key];
            const light = getTrafficLight(key, val);
            if (!light) return null;
            return (
              <View key={key} style={styles.trafficRow}>
                <View style={[styles.trafficDot, { backgroundColor: light.color }]} />
                <Text style={[styles.trafficLabel, { color: isDark ? "#D1D5DB" : "#1F2937" }]}>
                  {light.label} ({val}g)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 3. Tableau nutritionnel (Nutrition Grid) */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Tableau nutritionnel
        </Text>
        <View style={[styles.tableHeader, { borderBottomColor: isDark ? "#374151" : "#E5E7EB" }]}>
          <Text style={[styles.tableHeaderCell, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>Nutriment</Text>
          <Text style={[styles.tableHeaderCell, { color: isDark ? "#9CA3AF" : "#6B7280", textAlign: 'right' }]}>Pour 100g / 100ml</Text>
        </View>
        {[
          { label: "Énergie", value: nutrition.energy_kj ? `${nutrition.energy_kj} kJ (${nutrition.calories} kcal)` : `${nutrition.calories || 0} kcal` },
          { label: "Matières grasses", value: `${nutrition.fat ?? 0} g` },
          { label: "dont Acides gras saturés", value: `${nutrition.saturated_fat ?? 0} g`, indent: true },
          { label: "Glucides", value: `${nutrition.carbs ?? 0} g` },
          { label: "dont Sucres", value: `${nutrition.sugars ?? 0} g`, indent: true },
          { label: "Fibres alimentaires", value: `${nutrition.fiber ?? 0} g` },
          { label: "Protéines", value: `${nutrition.protein ?? 0} g` },
          { label: "Sel", value: `${nutrition.salt ?? 0} g` },
          { label: "Sodium", value: `${nutrition.sodium ?? 0} g`, indent: true },
        ].map((row, idx) => (
          <View 
            key={idx} 
            style={[
              styles.tableRow, 
              { borderBottomColor: isDark ? "#374151" : "#F3F4F6" },
              row.indent && styles.tableRowIndent
            ]}
          >
            <Text style={[styles.tableCellLabel, { color: isDark ? "#E5E7EB" : "#374151", fontWeight: row.indent ? 'normal' : '600' }]}>
              {row.label}
            </Text>
            <Text style={[styles.tableCellValue, { color: isDark ? "#F3F4F6" : "#111827" }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* 4. Ingrédients section */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Ingrédients
        </Text>
        <Text style={[styles.ingredientsText, { color: isDark ? "#D1D5DB" : "#374151" }]}>
          {nutrition.ingredients_text || "100% jus de pomme"}
        </Text>
        
        {/* Analysis subcards */}
        <View style={styles.analysisContainer}>
          <View style={styles.analysisRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.analysisText, { color: isDark ? "#A7F3D0" : "#064E3B" }]}>Sans huile de palme</Text>
          </View>
          <View style={styles.analysisRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.analysisText, { color: isDark ? "#A7F3D0" : "#064E3B" }]}>Végétalien</Text>
          </View>
          <View style={styles.analysisRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={[styles.analysisText, { color: isDark ? "#A7F3D0" : "#064E3B" }]}>Végétarien</Text>
          </View>
        </View>
      </View>

      {/* 5. Emballage, Origines & Transport */}
      <View style={[styles.sectionCard, { backgroundColor: isDark ? "#1F2937" : "#FFFFFF", marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
          Informations complémentaires
        </Text>

        {nutrition.packaging && (
          <View style={styles.infoBlock}>
            <Text style={[styles.infoBlockTitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>📦 Emballage</Text>
            <Text style={[styles.infoBlockVal, { color: isDark ? "#F3F4F6" : "#111827" }]}>{nutrition.packaging}</Text>
          </View>
        )}
        <View style={styles.infoBlock}>
          <Text style={[styles.infoBlockTitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>🌍 Pays de vente / Transport</Text>
          <Text style={[styles.infoBlockVal, { color: isDark ? "#F3F4F6" : "#111827" }]}>
            {nutrition.origins || "France"}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  scoreBadge: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.2)",
  },
  nutriScoreContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    padding: 2,
    marginBottom: 8,
  },
  nutriLetterBox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  nutriLetterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
  },
  nutriLetterTextActive: {
    color: "#FFFFFF",
  },
  badgeLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  badgeSub: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
  },
  novaBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  novaText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  ecoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  ecoLetterBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  ecoLetterText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  trafficLightsContainer: {
    gap: 12,
  },
  trafficRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  trafficDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  trafficLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableRowIndent: {
    paddingLeft: 16,
  },
  tableCellLabel: {
    flex: 1,
    fontSize: 13,
  },
  tableCellValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  ingredientsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  analysisContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  analysisRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analysisText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoBlock: {
    marginBottom: 12,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoBlockVal: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default NutritionCard;
