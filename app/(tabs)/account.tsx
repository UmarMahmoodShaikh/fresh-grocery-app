import { authApi, getStoredUser } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
    console.log("Navigate to Payment Methods");
  };

  const handleNotifications = () => {
    console.log("Navigate to Notifications Settings");
  };

  const handlePrivacySecurity = () => {
    console.log("Navigate to Privacy & Security");
  };

  const handleHelpSupport = () => {
    console.log("Navigate to Help & Support");
  };

  const handleAppSettings = () => {
    console.log("Navigate to App Settings");
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Back Button - Inside Card */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{userEmail}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{userPhone}</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          {/* Personal Information */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePersonalInfo}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="person-outline" size={22} color="#3B82F6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuSubtitle}>
                Update your profile details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Saved Addresses */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSavedAddresses}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#D8F3DC" }]}>
              <Ionicons name="location-outline" size={22} color="#52B788" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Saved Addresses</Text>
              <Text style={styles.menuSubtitle}>Manage delivery addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Order History */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleHistory}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="receipt-outline" size={22} color="#7C3AED" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Order History</Text>
              <Text style={styles.menuSubtitle}>View all past orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Payment Methods */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePaymentMethods}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#E9D5FF" }]}>
              <Ionicons name="card-outline" size={22} color="#9B59B6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Payment Methods</Text>
              <Text style={styles.menuSubtitle}>Manage payment options</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotifications}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FFE4D6" }]}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#2D6A4F"
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Customize your alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View style={styles.menuSection}>
          {/* Help & Support */}
          <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
            <View style={[styles.menuIcon, { backgroundColor: "#E0E7FF" }]}>
              <Ionicons name="help-circle-outline" size={22} color="#6366F1" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSubtitle}>Get help and contact us</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Show App Tour */}
          <TouchableOpacity style={styles.menuItem} onPress={handleShowTour}>
            <View style={[styles.menuIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="bulb-outline" size={22} color="#F59E0B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Show App Tour</Text>
              <Text style={styles.menuSubtitle}>Replay the guided tour</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* App Settings */}
          <TouchableOpacity style={styles.menuItem} onPress={handleAppSettings}>
            <View style={[styles.menuIcon, { backgroundColor: "#F3F4F6" }]}>
              <Ionicons name="settings-outline" size={22} color="#6B7280" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>App Settings</Text>
              <Text style={styles.menuSubtitle}>
                Preferences and configurations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Activity Stats */}
        <View style={styles.activityCardWrapper}>
          <LinearGradient
            colors={["#A855F7", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.activityCard}
          >
            <Text style={styles.activityTitle}>Your Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>$486</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>15</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>GroceryGo v1.0.0</Text>
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
