import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Home() {
  const userName = "John Doe"; // TODO: Get from user context/auth
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const tourSteps = [
    {
      title: "Scan Products",
      description:
        "📸 Tap here to scan product barcodes instantly and get detailed information!",
      target: "scanner",
      icon: "scan-outline",
      iconColor: "#2D6A4F",
      iconBg: "#D1FAE5",
    },
    {
      title: "My Cart",
      description:
        "🛒 View and manage your shopping cart. Add, remove, or update quantities easily!",
      target: "cart",
      icon: "cart-outline",
      iconColor: "#4A90E2",
      iconBg: "#DBEAFE",
    },
    {
      title: "Order History",
      description: "📜 Check your order history and track past purchases!",
      target: "history",
      icon: "time-outline",
      iconColor: "#9B59B6",
      iconBg: "#F3E8FF",
    },
    {
      title: "Account Settings",
      description:
        "👤 Manage your profile, payment methods, saved addresses, and app settings!",
      target: "account",
      icon: "person-outline",
      iconColor: "#FF6B35",
      iconBg: "#FFF4ED",
    },
  ];

  useEffect(() => {
    console.log("Homepage mounted, checking tour status...");
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenTour");
      console.log("Has seen tour:", hasSeenTour);

      if (!hasSeenTour) {
        console.log("First time user! Starting tour in 1 second...");
        setTimeout(() => {
          console.log("Starting custom tour now...");
          setTourVisible(true);
          setCurrentStep(0);
        }, 1000);
      } else {
        console.log("User has already seen the tour");
      }
    } catch (error) {
      console.error("Error checking tour status:", error);
    }
  };

  const handleTourNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleTourComplete();
    }
  };

  const handleTourSkip = () => {
    handleTourComplete();
  };

  const handleTourComplete = async () => {
    try {
      await AsyncStorage.setItem("hasSeenTour", "true");
      console.log("Tour completed and saved!");
      setTourVisible(false);
      setCurrentStep(0);
    } catch (error) {
      console.error("Error saving tour status:", error);
    }
  };

  const handleScanProduct = () => {
    console.log("Navigate to scanner");
    router.push("/scanner");
  };

  const handleMyCart = () => {
    // TODO: Navigate to cart screen
    console.log("Navigate to cart");
  };

  const handleHistory = () => {
    // TODO: Navigate to history screen
    console.log("Navigate to history");
  };

  const handleAccount = () => {
    router.push("/(tabs)/account");
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search triggered");
  };

  const handleShopNow = () => {
    // TODO: Navigate to products/offers
    console.log("Shop now clicked");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <ScrollView
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
            >
              {/* Notification Item 1 */}
              <TouchableOpacity style={styles.notificationItem}>
                <View
                  style={[styles.notifIcon, { backgroundColor: "#FFE4D6" }]}
                >
                  <Ionicons name="pricetag" size={20} color="#FF6B35" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>Special Offer!</Text>
                  <Text style={styles.notifDescription}>
                    Get 20% off on fresh produce. Valid until Feb 28.
                  </Text>
                  <Text style={styles.notifTime}>2 hours ago</Text>
                </View>
                <View style={styles.unreadDot} />
              </TouchableOpacity>

              {/* Notification Item 2 */}
              <TouchableOpacity style={styles.notificationItem}>
                <View
                  style={[styles.notifIcon, { backgroundColor: "#D8F3DC" }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#52B788" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>Order Delivered</Text>
                  <Text style={styles.notifDescription}>
                    Your order #1234 has been delivered successfully.
                  </Text>
                  <Text style={styles.notifTime}>5 hours ago</Text>
                </View>
                <View style={styles.unreadDot} />
              </TouchableOpacity>

              {/* Notification Item 3 */}
              <TouchableOpacity
                style={[styles.notificationItem, styles.readNotification]}
              >
                <View
                  style={[styles.notifIcon, { backgroundColor: "#DBEAFE" }]}
                >
                  <Ionicons name="cart" size={20} color="#4A90E2" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>Items Back in Stock</Text>
                  <Text style={styles.notifDescription}>
                    Fresh Organic Apples are now available!
                  </Text>
                  <Text style={styles.notifTime}>1 day ago</Text>
                </View>
              </TouchableOpacity>

              {/* Notification Item 4 */}
              <TouchableOpacity
                style={[styles.notificationItem, styles.readNotification]}
              >
                <View
                  style={[styles.notifIcon, { backgroundColor: "#E9D5FF" }]}
                >
                  <Ionicons name="star" size={20} color="#9B59B6" />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>New Rewards Available</Text>
                  <Text style={styles.notifDescription}>
                    You've earned 50 points! Redeem now.
                  </Text>
                  <Text style={styles.notifTime}>2 days ago</Text>
                </View>
              </TouchableOpacity>

              {/* Clear All Button */}
              <TouchableOpacity style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Guided Tour Modal */}
      <Modal
        visible={tourVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleTourSkip}
      >
        <View style={styles.tourOverlay}>
          {/* Tour Tooltip */}
          <View style={styles.tourTooltip}>
            {/* Step Indicator */}
            <View style={styles.tourHeader}>
              <Text style={styles.tourStepIndicator}>
                Step {currentStep + 1} of {tourSteps.length}
              </Text>
              <TouchableOpacity onPress={handleTourSkip}>
                <Ionicons name="close-circle" size={24} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            {/* Feature Icon */}
            <View
              style={[
                styles.tourIconContainer,
                { backgroundColor: tourSteps[currentStep].iconBg },
              ]}
            >
              <Ionicons
                name={tourSteps[currentStep].icon as any}
                size={48}
                color={tourSteps[currentStep].iconColor}
              />
            </View>

            {/* Tour Content */}
            <Text style={styles.tourTitle}>{tourSteps[currentStep].title}</Text>
            <Text style={styles.tourDescription}>
              {tourSteps[currentStep].description}
            </Text>

            {/* Tour Navigation */}
            <View style={styles.tourButtons}>
              <TouchableOpacity
                style={styles.tourSkipButton}
                onPress={handleTourSkip}
              >
                <Text style={styles.tourSkipText}>Skip Tour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tourNextButton}
                onPress={handleTourNext}
              >
                <Text style={styles.tourNextText}>
                  {currentStep < tourSteps.length - 1 ? "Next" : "Got it!"}
                </Text>
                {currentStep < tourSteps.length - 1 && (
                  <Ionicons name="arrow-forward" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header Section */}
      <LinearGradient colors={["#FF6B35", "#F77F00"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setNotificationsVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={handleSearch}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content Section - Scrollable */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Promotional Banner */}
          <LinearGradient
            colors={["#FF6B35", "#FF6B9D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            {/* Decorative fruit elements */}
            <View style={styles.promoDecorations}>
              <View style={styles.decorFruit1}>
                <Ionicons
                  name="leaf"
                  size={40}
                  color="rgba(255, 255, 255, 0.15)"
                />
              </View>
              <View style={styles.decorFruit2}>
                <Ionicons
                  name="nutrition"
                  size={50}
                  color="rgba(255, 255, 255, 0.1)"
                />
              </View>
            </View>

            <View style={styles.promoContentWrapper}>
              <View style={styles.promoHeader}>
                <View style={styles.promoIconLarge}>
                  <Ionicons name="pricetag" size={24} color="#FF6B35" />
                </View>
                <View>
                  <Text style={styles.promoLabel}>🎉 Special Offer</Text>
                  <Text style={styles.promoValidity}>
                    Valid until Feb 28, 2026
                  </Text>
                </View>
              </View>

              <Text style={styles.promoTitle}>
                Get <Text style={styles.promoHighlight}>20% OFF</Text>
                {"\n"}
                on Fresh Produce
              </Text>

              <View style={styles.promoFooter}>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={handleShopNow}
                >
                  <Text style={styles.shopButtonText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
                </TouchableOpacity>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save up to $50</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {/* Scan Product */}
              <Pressable style={styles.actionCard} onPress={handleScanProduct}>
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.actionIcon,
                        styles.scanIcon,
                        pressed && { backgroundColor: "#059669" },
                      ]}
                    >
                      <Ionicons name="scan-outline" size={28} color="#2D6A4F" />
                    </View>
                    <Text style={styles.actionText}>Scan Product</Text>
                  </>
                )}
              </Pressable>

              {/* My Cart */}
              <Pressable style={styles.actionCard} onPress={handleMyCart}>
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.actionIcon,
                        styles.cartIcon,
                        pressed && { backgroundColor: "#2563EB" },
                      ]}
                    >
                      <Ionicons name="cart-outline" size={28} color="#4A90E2" />
                    </View>
                    <Text style={styles.actionText}>My Cart</Text>
                  </>
                )}
              </Pressable>

              {/* History */}
              <Pressable style={styles.actionCard} onPress={handleHistory}>
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.actionIcon,
                        styles.historyIcon,
                        pressed && { backgroundColor: "#9333EA" },
                      ]}
                    >
                      <Ionicons name="time-outline" size={28} color="#9B59B6" />
                    </View>
                    <Text style={styles.actionText}>History</Text>
                  </>
                )}
              </Pressable>

              {/* Account */}
              <Pressable style={styles.actionCard} onPress={handleAccount}>
                {({ pressed }) => (
                  <>
                    <View
                      style={[
                        styles.actionIcon,
                        styles.accountIcon,
                        pressed && { backgroundColor: "#EA580C" },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={28}
                        color="#FF6B35"
                      />
                    </View>
                    <Text style={styles.actionText}>Account</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Recommended for You */}
          <View style={styles.recommendedContainer}>
            <View style={styles.recommendedHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScrollContent}
            >
              <View style={styles.productsRow}>
                {/* Product 1 */}
                <View style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="leaf" size={32} color="#52B788" />
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-29%</Text>
                    </View>
                  </View>
                  <Text style={styles.productName}>Fresh Organic Apples</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>$4.99</Text>
                    <Text style={styles.originalPrice}>$6.99</Text>
                  </View>
                </View>

                {/* Product 2 */}
                <View style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="nutrition" size={32} color="#FFB703" />
                    </View>
                    <View style={[styles.popularBadge]}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  </View>
                  <Text style={styles.productName}>Whole Grain Bread</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>$2.99</Text>
                  </View>
                </View>

                {/* Product 3 - Additional product */}
                <View style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="water" size={32} color="#4A90E2" />
                    </View>
                  </View>
                  <Text style={styles.productName}>Fresh Milk</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>$3.49</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  notificationButton: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "#9CA3AF",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  promoBanner: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  promoDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorFruit1: {
    position: "absolute",
    top: -10,
    right: 20,
    transform: [{ rotate: "15deg" }],
  },
  decorFruit2: {
    position: "absolute",
    bottom: -15,
    left: 10,
    transform: [{ rotate: "-20deg" }],
  },
  promoContentWrapper: {
    position: "relative",
    zIndex: 1,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  promoIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoLabel: {
    fontSize: 14,
    color: "white",
    fontWeight: "700",
    marginBottom: 2,
  },
  promoValidity: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    marginBottom: 16,
    lineHeight: 32,
  },
  promoHighlight: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFE66D",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  promoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shopButton: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  shopButtonText: {
    color: "#FF6B35",
    fontSize: 15,
    fontWeight: "700",
  },
  savingsBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  savingsText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  scanIcon: {
    backgroundColor: "#D8F3DC",
  },
  cartIcon: {
    backgroundColor: "#DBEAFE",
  },
  historyIcon: {
    backgroundColor: "#E9D5FF",
  },
  accountIcon: {
    backgroundColor: "#FFE4D6",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  recommendedContainer: {
    marginTop: 28,
  },
  recommendedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  productsScrollContent: {
    paddingRight: 20,
  },
  productsRow: {
    flexDirection: "row",
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  productImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  productImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  popularBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#52B788",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#52B788",
  },
  originalPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationsList: {
    paddingHorizontal: 20,
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
    backgroundColor: "#FFF9F5",
  },
  readNotification: {
    backgroundColor: "white",
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  notifDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
    marginTop: 6,
  },
  clearAllButton: {
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  clearAllText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  // Custom Tour Styles
  tourOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tourTooltip: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: "#FF6B35",
  },
  tourHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tourStepIndicator: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B35",
    backgroundColor: "#FFF4ED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tourIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 16,
  },
  tourTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  tourDescription: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  tourButtons: {
    flexDirection: "row",
    gap: 12,
  },
  tourSkipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tourSkipText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
  tourNextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tourNextText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
