import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, getStoredUser } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Appearance,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";


export default function Account() {
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [memberSince, setMemberSince] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const user = await getStoredUser();
      if (user) {
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
        setUserName(name || user.email?.split("@")[0] || "User");
        setUserEmail(user.email || "");
        setUserPhone(user.formatted_phone || user.phone || "");
        if (user.created_at) {
          const date = new Date(user.created_at);
          setMemberSince(date.toLocaleDateString("en-US", { month: "long", year: "numeric" }));
        }
      }
    };
    loadUser();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.replace("/(auth)/login");
  };

  const handlePersonalInfo = () => {
    router.push("/profile");
  };

  const handleSavedAddresses = () => {
    router.push("/addresses");
  };

  const handlePaymentMethods = () => {
    router.push("/payment-methods");
  };

  const [isDarkMode, setIsDarkMode] = useState(Appearance.getColorScheme() === "dark");

  const toggleDarkMode = () => {
    const newMode = isDarkMode ? "light" : "dark";
    Appearance.setColorScheme(newMode);
    setIsDarkMode(!isDarkMode);
  };

  const handleShowTour = async () => {
    try {
      // Clear the tour status
      await AsyncStorage.removeItem("hasSeenTour");
      console.log("Tour status cleared!");

      Alert.alert(
        "App Tour Reset",
        "Go back to the homepage to see the guided tour!",
        [
          {
            text: "Go to Homepage",
            onPress: () => router.push("/(tabs)"),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ],
      );
    } catch (error) {
      console.error("Error resetting tour:", error);
      Alert.alert("Error", "Failed to reset tour. Please try again.");
    }
  };

  const handleHistory = () => {
    router.push("/(tabs)/history");
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && { backgroundColor: "#111827" }]}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, isDarkMode && { backgroundColor: "#1F2937", borderBottomColor: "#374151" }]}>
          {/* Back Button - Inside Card */}
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, isDarkMode && { backgroundColor: "#374151" }]}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#F9FAFB" : "#374151"} />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, isDarkMode && { backgroundColor: "#0369A1", borderColor: "#0284C7" }]}>
              <Text style={[styles.avatarText, isDarkMode && { color: "#F0F9FF" }]}>
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
          </View>
          <Text style={[styles.profileName, isDarkMode && { color: "#F9FAFB" }]}>{userName}</Text>
          <Text style={[styles.memberSince, isDarkMode && { color: "#9CA3AF" }]}>Member since {memberSince}</Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <Text style={[styles.contactText, isDarkMode && { color: "#D1D5DB" }]}>{userEmail}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <Text style={[styles.contactText, isDarkMode && { color: "#D1D5DB" }]}>{userPhone}</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={[styles.menuSection, isDarkMode && { backgroundColor: "#1F2937", borderColor: "#374151" }]}>
          {/* Personal Information */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePersonalInfo}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#1E3A8A" : "#DBEAFE" }]}>
              <Ionicons name="person-outline" size={22} color={isDarkMode ? "#60A5FA" : "#3B82F6"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Personal Information</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>
                Update your profile details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
          </TouchableOpacity>

          {/* Saved Addresses */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSavedAddresses}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#166534" : "#D8F3DC" }]}>
              <Ionicons name="location-outline" size={22} color={isDarkMode ? "#4ADE80" : "#52B788"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Saved Addresses</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>Manage delivery addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
          </TouchableOpacity>

          {/* Order History */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleHistory}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#581C87" : "#F3E8FF" }]}>
              <Ionicons name="receipt-outline" size={22} color={isDarkMode ? "#A78BFA" : "#7C3AED"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Order History</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>View all past orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePaymentMethods}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#4C1D95" : "#E9D5FF" }]}>
              <Ionicons name="card-outline" size={22} color={isDarkMode ? "#A78BFA" : "#9B59B6"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Payment Methods</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>Manage payment options</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View style={[styles.menuSection, isDarkMode && { backgroundColor: "#1F2937", borderColor: "#374151" }]}>
          {/* Show App Tour */}
          <TouchableOpacity style={styles.menuItem} onPress={handleShowTour}>
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#92400E" : "#FEF3C7" }]}>
              <Ionicons name="bulb-outline" size={22} color={isDarkMode ? "#FBBF24" : "#F59E0B"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Show App Tour</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>Replay the guided tour</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <View style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#374151" : "#1F2937" }]}>
              <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={22} color="#F9FAFB" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Dark Mode</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>Toggle app theme</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D1D5DB", true: "#52B788" }}
              thumbColor={"#fff"}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, isDarkMode && { backgroundColor: "#7F1D1D" }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={isDarkMode ? "#FECACA" : "#DC2626"} />
          <Text style={[styles.logoutText, isDarkMode && { color: "#FECACA" }]}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={[styles.appVersion, isDarkMode && { color: "#6B7280" }]}>GroceryGo v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContainer: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 48, // Extra padding for back button
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 16,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 24, // Positioned safely from the top
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10, // Ensure it's above other elements
  },
  avatarContainer: {
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0F2FE", // Light blue background
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#BAE6FD",
  },
  avatarText: {
    fontSize: 36,
    fontFamily: "Outfit-Bold",
    color: "#0369A1", // Dark blue text
  },
  profileName: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    color: "#6B7280",
    marginBottom: 16,
  },
  contactInfo: {
    alignItems: "center",
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#4B5563",
  },
  menuSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    color: "#1F2937",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    color: "#6B7280",
  },
  activityCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  activityCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#fff",
    marginBottom: 20,
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "Outfit-Bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: "#FDF4FF",
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#FDF4FF",
    opacity: 0.2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#DC2626",
  },
  appVersion: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    color: "#9CA3AF",
    marginBottom: 32,
  },
});
