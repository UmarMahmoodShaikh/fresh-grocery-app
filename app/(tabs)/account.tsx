import { authApi, getStoredUser, budgetApi, categoriesApi } from "@/services/api";
import { useBudget } from "@/context/BudgetContext";
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
  View,
  Modal,
  ActivityIndicator,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Account() {
  const { refreshBudgets } = useBudget();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [memberSince, setMemberSince] = useState("");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<number | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileTotal, setNewProfileTotal] = useState("");

  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [editingCategoryBudgets, setEditingCategoryBudgets] = useState<Record<number, any[]>>({});

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

  useEffect(() => {
    const loadAllCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        const data = Array.isArray((res.data as any)?.categories)
          ? (res.data as any).categories
          : Array.isArray(res.data)
            ? res.data
            : [];
        setAllCategories(data);
      } catch (err) {
        console.error("Failed to load categories in account screen", err);
      }
    };
    loadAllCategories();
  }, []);

  useEffect(() => {
    if (expandedProfileId && !editingCategoryBudgets[expandedProfileId]) {
      const activeProf = profiles.find(p => p.id === expandedProfileId);
      if (activeProf) {
        setEditingCategoryBudgets(prev => ({
          ...prev,
          [expandedProfileId]: activeProf.category_budgets.map((cb: any) => ({
            category_id: cb.category_id,
            category_name: cb.category_name,
            amount: cb.amount,
          }))
        }));
      }
    }
  }, [expandedProfileId, profiles]);

  const handleBack = () => {
    router.back();
  };

  const fetchProfilesOnly = async () => {
    try {
      const res = await budgetApi.getAll();
      if (res.data) {
        setProfiles(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh budget profiles", err);
    }
  };

  const handleShowProfiles = async () => {
    setShowProfilesModal(true);
    setIsLoadingProfiles(true);
    try {
      const user = await getStoredUser();
      if (!user) {
        Alert.alert("Authentication Required", "Please log in to view and manage cloud budget profiles.");
        setIsLoadingProfiles(false);
        setShowProfilesModal(false);
        return;
      }
      await fetchProfilesOnly();
    } catch (err) {
      console.error("Failed to fetch budget profiles", err);
      Alert.alert("Error", "Failed to retrieve budget profiles. Please try again.");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleActivateProfile = async (profileId: number) => {
    setIsLoadingProfiles(true);
    try {
      await budgetApi.activate(profileId);
      await fetchProfilesOnly();
      await refreshBudgets();
      Alert.alert("Success", "Budget profile activated successfully!");
    } catch (err) {
      console.error("Failed to activate profile", err);
      Alert.alert("Error", "Failed to activate budget profile.");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleDeleteProfile = async (profile: any) => {
    if (profile.is_active) {
      Alert.alert("Cannot Delete", "You cannot delete the active budget profile.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete profile "${profile.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoadingProfiles(true);
            try {
              await budgetApi.delete(profile.id);
              await fetchProfilesOnly();
              await refreshBudgets();
              Alert.alert("Success", "Budget profile deleted successfully!");
            } catch (err) {
              console.error("Failed to delete profile", err);
              Alert.alert("Error", "Failed to delete budget profile.");
            } finally {
              setIsLoadingProfiles(false);
            }
          }
        }
      ]
    );
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim() || !newProfileTotal.trim()) {
      Alert.alert("Missing Fields", "Please enter a profile name and budget amount.");
      return;
    }

    const budgetVal = parseFloat(newProfileTotal);
    if (isNaN(budgetVal) || budgetVal < 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive budget amount.");
      return;
    }

    setIsLoadingProfiles(true);
    try {
      await budgetApi.create({
        name: newProfileName.trim(),
        total_budget: budgetVal
      });
      await fetchProfilesOnly();
      await refreshBudgets();
      setIsCreatingProfile(false);
      setNewProfileName("");
      setNewProfileTotal("");
      Alert.alert("Success", "Budget profile created successfully!");
    } catch (err) {
      console.error("Failed to create profile", err);
      Alert.alert("Error", "Failed to create budget profile.");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSaveChanges = async (profile: any) => {
    setIsLoadingProfiles(true);
    try {
      const origBudgets = profile.category_budgets || [];
      const currentBudgets = editingCategoryBudgets[profile.id] || [];
      const attributes: any[] = [];
      
      // Add or update current ones
      currentBudgets.forEach(cb => {
        attributes.push({
          category_id: cb.category_id,
          amount: parseFloat(cb.amount) || 0
        });
      });
      
      // Mark deleted ones as destroyed
      origBudgets.forEach(ob => {
        if (!currentBudgets.some(cb => cb.category_id === ob.category_id)) {
          attributes.push({
            category_id: ob.category_id,
            amount: 0,
            _destroy: true
          });
        }
      });

      await budgetApi.update(profile.id, {
        name: profile.name,
        total_budget: profile.total_budget,
        category_budgets_attributes: attributes
      });

      // Clear local cache for this profile so it reloads fresh
      setEditingCategoryBudgets(prev => {
        const next = { ...prev };
        delete next[profile.id];
        return next;
      });

      await fetchProfilesOnly();
      await refreshBudgets();
      Alert.alert("Success", "Category budgets updated successfully!");
    } catch (err) {
      console.error("Failed to save category budgets", err);
      Alert.alert("Error", "Failed to save budget category changes.");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.replace("/(auth)/login");
  };

  const handlePersonalInfo = () => {
    router.push("/profile");
  };

  const handleFavorites = () => {
    router.push("/(tabs)/favorites");
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
      {/* Header */}
      <View style={[styles.header, isDarkMode && { backgroundColor: "#1F2937", borderBottomColor: "#374151" }]}>
        <Text style={[styles.headerTitle, isDarkMode && { color: "#F9FAFB" }]}>Account</Text>
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, isDarkMode && { backgroundColor: "#1F2937", borderBottomColor: "#374151" }]}>
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

          {/* My Favorites */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleFavorites}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#7F1D1D" : "#FEE2E2" }]}>
              <Ionicons name="heart-outline" size={22} color={isDarkMode ? "#F87171" : "#EF4444"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>My Favorites</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>View saved products</Text>
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

          {/* Budget Profiles */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleShowProfiles}
          >
            <View style={[styles.menuIcon, { backgroundColor: isDarkMode ? "#3B0764" : "#F3E8FF" }]}>
              <Ionicons name="wallet-outline" size={22} color={isDarkMode ? "#C084FC" : "#7C3AED"} />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, isDarkMode && { color: "#F9FAFB" }]}>Budget Profiles</Text>
              <Text style={[styles.menuSubtitle, isDarkMode && { color: "#9CA3AF" }]}>View all active & saved budget profiles</Text>
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

      {/* Budget Profiles Modal */}
      <Modal
        visible={showProfilesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowProfilesModal(false);
          setIsCreatingProfile(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDarkMode && { backgroundColor: "#1F2937", borderColor: "#374151" }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, isDarkMode && { borderBottomColor: "#374151" }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="wallet-outline" size={24} color="#7C3AED" />
                <Text style={[styles.modalTitle, isDarkMode && { color: "#F9FAFB" }]}>Budget Profiles</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {!isCreatingProfile && (
                  <TouchableOpacity onPress={() => setIsCreatingProfile(true)} style={styles.addProfileBtn}>
                    <Ionicons name="add-circle-outline" size={24} color="#10B981" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { setShowProfilesModal(false); setIsCreatingProfile(false); }} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={24} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            {isLoadingProfiles ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={[styles.loaderText, isDarkMode && { color: "#9CA3AF" }]}>Loading profiles...</Text>
              </View>
            ) : isCreatingProfile ? (
              <View style={styles.formContainer}>
                <Text style={[styles.formTitle, isDarkMode && { color: "#F9FAFB" }]}>Create New Profile</Text>
                
                <Text style={[styles.inputLabel, isDarkMode && { color: "#9CA3AF" }]}>Profile Name</Text>
                <TextInput
                  style={[styles.formInput, isDarkMode && { backgroundColor: "#111827", borderColor: "#374151", color: "#F9FAFB" }]}
                  placeholder="e.g. Monthly Grocery"
                  placeholderTextColor={isDarkMode ? "#4B5563" : "#9CA3AF"}
                  value={newProfileName}
                  onChangeText={setNewProfileName}
                />

                <Text style={[styles.inputLabel, isDarkMode && { color: "#9CA3AF" }]}>Total Budget Limit (€)</Text>
                <TextInput
                  style={[styles.formInput, isDarkMode && { backgroundColor: "#111827", borderColor: "#374151", color: "#F9FAFB" }]}
                  placeholder="e.g. 200.00"
                  placeholderTextColor={isDarkMode ? "#4B5563" : "#9CA3AF"}
                  keyboardType="numeric"
                  value={newProfileTotal}
                  onChangeText={setNewProfileTotal}
                />

                <View style={styles.formButtonRow}>
                  <TouchableOpacity 
                    style={[styles.formCancelBtn, isDarkMode && { borderColor: "#374151" }]}
                    onPress={() => {
                      setIsCreatingProfile(false);
                      setNewProfileName("");
                      setNewProfileTotal("");
                    }}
                  >
                    <Text style={[styles.formCancelText, isDarkMode && { color: "#9CA3AF" }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.formSubmitBtn}
                    onPress={handleCreateProfile}
                  >
                    <Text style={styles.formSubmitText}>Create Profile</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : profiles.length === 0 ? (
              <View style={styles.emptyProfilesContainer}>
                <Ionicons name="wallet-outline" size={48} color={isDarkMode ? "#4B5563" : "#D1D5DB"} />
                <Text style={[styles.emptyProfilesText, isDarkMode && { color: "#9CA3AF" }]}>No budget profiles found.</Text>
                <TouchableOpacity 
                  style={styles.createFirstProfileBtn}
                  onPress={() => setIsCreatingProfile(true)}
                >
                  <Text style={styles.createFirstProfileText}>Create Your First Profile</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {profiles.map((profile) => {
                  const isExpanded = expandedProfileId === profile.id;
                  return (
                    <View 
                      key={profile.id.toString()} 
                      style={[
                        styles.profileItemCard, 
                        isDarkMode && { backgroundColor: "#111827", borderColor: "#374151" },
                        profile.is_active && { borderColor: "#10B981", borderWidth: 1.5 }
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.profileItemHeader}
                        onPress={() => setExpandedProfileId(isExpanded ? null : profile.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <Text style={[styles.profileItemName, isDarkMode && { color: "#F9FAFB" }]}>
                              {profile.name}
                            </Text>
                            {profile.is_active && (
                              <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>Active</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.profileItemTotal, { color: isDarkMode ? "#10B981" : "#059669" }]}>
                            Total: €{Number(profile.total_budget).toFixed(2)}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={[styles.categoryListContainer, isDarkMode && { borderTopColor: "#374151" }]}>
                          {/* Actions Section */}
                          <View style={styles.profileActionsRow}>
                            {!profile.is_active ? (
                              <TouchableOpacity 
                                style={styles.activateBtn}
                                onPress={() => handleActivateProfile(profile.id)}
                              >
                                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                                <Text style={styles.activateBtnText}>Activate</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.activeStatusIndicator}>
                                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                <Text style={styles.activeStatusText}>Active Budget</Text>
                              </View>
                            )}

                            {!profile.is_active && (
                              <TouchableOpacity 
                                style={styles.deleteProfileBtn}
                                onPress={() => handleDeleteProfile(profile)}
                              >
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                <Text style={styles.deleteProfileBtnText}>Delete</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          <Text style={[styles.categorySectionTitle, isDarkMode && { color: "#9CA3AF" }]}>
                            Category Budgets:
                          </Text>
                          {(editingCategoryBudgets[profile.id] || []).length > 0 ? (
                            (editingCategoryBudgets[profile.id] || []).map((cb: any) => (
                              <View key={cb.category_id.toString()} style={styles.categoryBudgetItem}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                                  <Ionicons name="folder-outline" size={14} color="#7C3AED" />
                                  <Text style={[styles.categoryItemName, isDarkMode && { color: "#D1D5DB" }]} numberOfLines={1}>
                                    {cb.category_name || `Category ${cb.category_id}`}
                                  </Text>
                                </View>
                                
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                  <Text style={[styles.euroSymbol, isDarkMode && { color: "#9CA3AF" }]}>€</Text>
                                  <TextInput
                                    style={[styles.categoryAmountInput, isDarkMode && { backgroundColor: "#111827", borderColor: "#374151", color: "#F9FAFB" }]}
                                    value={cb.amount !== undefined && cb.amount !== null ? String(cb.amount) : ""}
                                    keyboardType="numeric"
                                    onChangeText={(text) => {
                                      setEditingCategoryBudgets(prev => {
                                        const list = prev[profile.id] || [];
                                        const nextList = list.map(item => 
                                          item.category_id === cb.category_id ? { ...item, amount: text } : item
                                        );
                                        return { ...prev, [profile.id]: nextList };
                                      });
                                    }}
                                  />
                                  <TouchableOpacity
                                    onPress={() => {
                                      setEditingCategoryBudgets(prev => {
                                        const list = prev[profile.id] || [];
                                        const nextList = list.filter(item => item.category_id !== cb.category_id);
                                        return { ...prev, [profile.id]: nextList };
                                      });
                                    }}
                                    style={styles.removeCategoryBudgetItemBtn}
                                  >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.noCategoriesText, isDarkMode && { color: "#6B7280" }]}>
                              No category-specific budgets set
                            </Text>
                          )}

                          {/* Add Available Category Section */}
                          {(() => {
                            const addedIds = (editingCategoryBudgets[profile.id] || []).map(item => item.category_id);
                            const available = allCategories.filter(cat => !addedIds.includes(cat.id));
                            if (available.length === 0) return null;
                            return (
                              <View style={{ marginTop: 12 }}>
                                <Text style={[styles.categorySectionTitle, isDarkMode && { color: "#9CA3AF" }]}>
                                  + Add Budget Category:
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addCategoryPillContainer}>
                                  {available.map(cat => (
                                    <TouchableOpacity
                                      key={cat.id.toString()}
                                      style={styles.addCategoryPill}
                                      onPress={() => {
                                        setEditingCategoryBudgets(prev => {
                                          const list = prev[profile.id] || [];
                                          return {
                                            ...prev,
                                            [profile.id]: [
                                              ...list,
                                              { category_id: cat.id, category_name: cat.name, amount: "10.00" }
                                            ]
                                          };
                                        });
                                      }}
                                    >
                                      <Text style={styles.addCategoryPillText}>+ {cat.name}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            );
                          })()}

                          {/* Save Changes button */}
                          <TouchableOpacity
                            style={styles.saveChangesBtn}
                            onPress={() => handleSaveChanges(profile)}
                          >
                            <Ionicons name="save-outline" size={16} color="#fff" />
                            <Text style={styles.saveChangesBtnText}>Save Budget Changes</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  profileCard: {
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 16,
    position: "relative",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: "50%",
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
  },
  closeModalBtn: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#4B5563",
  },
  emptyProfilesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyProfilesText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#6B7280",
  },
  modalScroll: {
    padding: 20,
  },
  profileItemCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
    overflow: "hidden",
  },
  profileItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  profileItemName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
  },
  activeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
    color: "#065F46",
  },
  profileItemTotal: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    marginTop: 2,
  },
  categoryListContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 16,
    backgroundColor: "rgba(124, 58, 237, 0.03)",
  },
  categorySectionTitle: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryBudgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 231, 235, 0.5)",
  },
  categoryItemName: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#4B5563",
  },
  categoryItemAmount: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
  },
  noCategoriesText: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  addProfileBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: "#4B5563",
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    color: "#1F2937",
    marginBottom: 20,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  formCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  formCancelText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#4B5563",
  },
  formSubmitBtn: {
    flex: 2,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  formSubmitText: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#fff",
  },
  createFirstProfileBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  createFirstProfileText: {
    color: "#fff",
    fontFamily: "Outfit-Bold",
    fontSize: 14,
  },
  profileActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 231, 235, 0.5)",
  },
  activateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activateBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  activeStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeStatusText: {
    color: "#10B981",
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  deleteProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: "#FEF2F2",
  },
  deleteProfileBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  euroSymbol: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#4B5563",
  },
  categoryAmountInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 70,
    textAlign: "right",
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#1F2937",
  },
  removeCategoryBudgetItemBtn: {
    padding: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  addCategoryPillContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  addCategoryPill: {
    backgroundColor: "#ECE0FD",
    borderWidth: 1,
    borderColor: "#C084FC",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addCategoryPillText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: "#7C3AED",
  },
  saveChangesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
    gap: 8,
  },
  saveChangesBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Outfit-Bold",
  },
});
