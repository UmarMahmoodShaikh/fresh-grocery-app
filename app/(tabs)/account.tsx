import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
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
  const userName = "John Doe";
  const userEmail = "john.doe@example.com";
  const userPhone = "+1 (555) 123-4567";
  const memberSince = "January 2025";

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logout");
    router.replace("/(auth)/login");
  };

  const handlePersonalInfo = () => {
    console.log("Navigate to Personal Info");
  };

  const handleSavedAddresses = () => {
    console.log("Navigate to Saved Addresses");
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
                color="#FF6B35"
              />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Customize your alerts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Privacy & Security */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePrivacySecurity}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Privacy & Security</Text>
              <Text style={styles.menuSubtitle}>Manage security settings</Text>
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.appVersion}>GroceryGo v1.0.0</Text>
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
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#52B788",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  contactInfo: {
    width: "100%",
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#374151",
  },
  menuSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  activityCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#A855F7",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
  appVersion: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 16,
    marginBottom: 24,
  },
});
