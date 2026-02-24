import { useCart } from "@/context/CartContext";
import {
  addressesApi,
  brandsApi,
  categoriesApi,
  getStoredUser,
  ordersApi,
  productsApi,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const FloatingPlusOne = ({ x, y }: { x: number; y: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: y - 20,
        left: x - 15,
        transform: [{ translateY }],
        opacity,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Text style={{ color: "#2D6A4F", fontSize: 24, fontWeight: "bold", textShadowColor: "rgba(255,255,255,0.8)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 }}>
        +1
      </Text>
    </Animated.View>
  );
};

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  fruits: "nutrition",
  vegetables: "leaf",
  dairy: "water",
  bakery: "pizza",
  beverages: "cafe",
  snacks: "fast-food",
  meat: "restaurant",
  seafood: "fish",
  frozen: "snow",
  pantry: "basket",
};

const getCategoryIcon = (name: string): string => {
  const key = name?.toLowerCase() || "";
  return CATEGORY_ICONS[key] || "grid";
};

const CATEGORY_COLORS = [
  { bg: "#FFF3E0", text: "#2D6A4F" },
  { bg: "#E8F5E9", text: "#2D6A4F" },
  { bg: "#E3F2FD", text: "#1976D2" },
  { bg: "#F3E8FF", text: "#7C3AED" },
  { bg: "#FFF8E1", text: "#F59E0B" },
  { bg: "#FCE4EC", text: "#E91E63" },
  { bg: "#E0F7FA", text: "#00ACC1" },
  { bg: "#F1F8E9", text: "#689F38" },
];

export default function HomeScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const { addToCart } = useCart();
  const [userName, setUserName] = useState("User");
  const [defaultAddress, setDefaultAddress] = useState<string | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [tourVisible, setTourVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [plusAnimations, setPlusAnimations] = useState<{ id: string; x: number; y: number }[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
    loadDefaultAddress();
    loadData();
    loadActiveOrders();
    checkFirstTimeUser();

    const interval = setInterval(loadActiveOrders, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveOrders = async () => {
    try {
      const result = await ordersApi.getAll();
      if (result.data && Array.isArray(result.data)) {
        const active = (result.data as any[]).filter((o) =>
          ["pending", "processing", "shipped"].includes(o.status?.toLowerCase())
        );
        setActiveOrders(active);
      }
    } catch {
      // silently fail
    }
  };

  const loadUser = async () => {
    const user = await getStoredUser();
    if (user) {
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
      setUserName(name || user.email?.split("@")[0] || "User");
    }
  };

  const loadDefaultAddress = async () => {
    try {
      const result = await addressesApi.getAll();
      if (result.data && Array.isArray(result.data)) {
        const def = (result.data as any[]).find((a: any) => a.is_default);
        if (def) {
          setDefaultAddress(`${def.street}, ${def.city}`);
        } else if (result.data.length > 0) {
          const first = result.data[0] as any;
          setDefaultAddress(`${first.street}, ${first.city}`);
        }
      }
    } catch {
      // silently fail
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, brandRes, prodRes] = await Promise.all([
        categoriesApi.getAll(),
        brandsApi.getAll(),
        productsApi.getAll(),
      ]);
      if (catRes.data) setCategories(catRes.data as any[]);
      if (brandRes.data) setBrands(brandRes.data as any[]);
      if (prodRes.data) setProducts(prodRes.data as any[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const tourSteps = [
    {
      title: "Scan Products",
      description:
        "📸 Tap here to scan product barcodes instantly and get detailed information!",
      icon: "scan-outline",
      iconColor: "#2D6A4F",
      iconBg: "#D1FAE5",
    },
    {
      title: "My Cart",
      description:
        "🛒 View and manage your shopping cart. Add, remove, or update quantities easily!",
      icon: "cart-outline",
      iconColor: "#4A90E2",
      iconBg: "#DBEAFE",
    },
    {
      title: "Order History",
      description: "📜 Check your order history and track past purchases!",
      icon: "time-outline",
      iconColor: "#9B59B6",
      iconBg: "#F3E8FF",
    },
    {
      title: "Account Settings",
      description:
        "👤 Manage your profile, payment methods, saved addresses, and app settings!",
      icon: "person-outline",
      iconColor: "#2D6A4F",
      iconBg: "#FFF4ED",
    },
  ];

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenTour = await AsyncStorage.getItem("hasSeenTour");
      if (!hasSeenTour) {
        setTimeout(() => {
          setTourVisible(true);
          setCurrentStep(0);
        }, 1000);
      }
    } catch { }
  };

  const handleTourNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleTourComplete();
    }
  };

  const handleTourSkip = () => handleTourComplete();

  const handleTourComplete = async () => {
    try {
      await AsyncStorage.setItem("hasSeenTour", "true");
      setTourVisible(false);
      setCurrentStep(0);
    } catch { }
  };

  // ── Render helpers ────────────────────────────────────

  const renderCategoryItem = (cat: any, index: number) => {
    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
    return (
      <TouchableOpacity
        key={cat.id}
        style={styles.categoryItem}
        onPress={() => router.push(`/category/${cat.id}?name=${encodeURIComponent(cat.name)}` as any)}
        activeOpacity={0.75}
      >
        <View style={[styles.categoryCircle, { backgroundColor: color.bg }]}>
          {cat.image_url ? (
            <Image
              source={{ uri: cat.image_url }}
              style={styles.categoryImage}
            />
          ) : (
            <Ionicons
              name={getCategoryIcon(cat.name) as any}
              size={26}
              color={color.text}
            />
          )}
        </View>
        <Text style={styles.categoryName} numberOfLines={1}>
          {cat.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBrandItem = (brand: any) => (
    <TouchableOpacity
      key={brand.id}
      style={styles.brandCard}
      onPress={() => router.push(`/brand/${brand.id}?name=${encodeURIComponent(brand.name)}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.brandImageWrap}>
        {brand.image_url ? (
          <Image
            source={{ uri: brand.image_url }}
            style={styles.brandImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.brandPlaceholder}>
            <Ionicons name="storefront" size={28} color="#2D6A4F" />
          </View>
        )}
      </View>
      <Text style={styles.brandName} numberOfLines={1}>
        {brand.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductCard = (product: any) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productCard}
      onPress={() => router.push(`/product/${product.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.productImageWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.productPlaceholder}>
            <Ionicons name="cube-outline" size={36} color="#ccc" />
          </View>
        )}
        {product.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{product.category.name}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && (
          <Text style={styles.productBrand}>{product.brand.name}</Text>
        )}
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>
            €{Number(product.price).toFixed(2)}
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={(e) => handleAddCart(e, product)}
            hitSlop={8}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleMyCart = () => {
    console.log("Navigate to cart");
    router.push("/(tabs)/cart" as any);
  };

  const handleHistory = () => {
    router.push("/(tabs)/history" as any);
  };

  const handleAccount = () => {
    router.push("/profile" as any);
  };

  const handleSearch = () => {
    router.push("/(tabs)/search" as any);
  };

  const handleShopNow = () => {
    router.push("/(tabs)/search" as any);
  };

  const handleAddCart = (e: any, product: any) => {
    e.stopPropagation?.();
    if (e.nativeEvent) {
      const { pageX, pageY } = e.nativeEvent;
      const id = Math.random().toString();
      setPlusAnimations((prev) => [...prev, { id, x: pageX, y: pageY }]);
      setTimeout(() => {
        setPlusAnimations((prev) => prev.filter((a) => a.id !== id));
      }, 800);
    }
    addToCart(product);
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
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setNotificationsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeOrders.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>No new notifications</Text>
                </View>
              ) : (
                activeOrders.map((order) => {
                  let color = "#D97706";
                  let bg = "#FEF3C7";
                  let icon = "time-outline";
                  const status = order.status?.toLowerCase();
                  if (status === "processing") { color = "#2563EB"; bg = "#DBEAFE"; icon = "refresh-outline"; }
                  if (status === "shipped") { color = "#7C3AED"; bg = "#EDE9FE"; icon = "bicycle-outline"; }

                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.notificationItem}
                      onPress={() => {
                        setNotificationsVisible(false);
                        router.push(`/order/${order.id}` as any);
                      }}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: bg }]}>
                        <Ionicons name={icon as any} size={20} color={color} />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={styles.notifTitle}>Order #{order.id} is {status}</Text>
                        <Text style={styles.notifDescription}>
                          {order.order_items?.length ?? 0} items • €{Number(order.total).toFixed(2)}
                        </Text>
                        <Text style={styles.notifTime}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Guided Tour Modal */}
      <Modal
        visible={tourVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleTourSkip}
      >
        <View style={styles.tourOverlay}>
          <View style={styles.tourTooltip}>
            <View style={styles.tourHeader}>
              <Text style={styles.tourStepIndicator}>
                Step {currentStep + 1} of {tourSteps.length}
              </Text>
              <TouchableOpacity onPress={handleTourSkip}>
                <Ionicons name="close-circle" size={24} color="#2D6A4F" />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.tourIconContainer,
                {
                  backgroundColor:
                    tourSteps[currentStep]?.iconBg || "#FFF4ED",
                },
              ]}
            >
              <Ionicons
                name={(tourSteps[currentStep]?.icon as any) || "star"}
                size={40}
                color={tourSteps[currentStep]?.iconColor || "#2D6A4F"}
              />
            </View>
            <Text style={styles.tourTitle}>
              {tourSteps[currentStep]?.title}
            </Text>
            <Text style={styles.tourDescription}>
              {tourSteps[currentStep]?.description}
            </Text>
            <View style={styles.tourDots}>
              {tourSteps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.tourDot,
                    i === currentStep && styles.tourDotActive,
                  ]}
                />
              ))}
            </View>
            <View style={styles.tourActions}>
              <TouchableOpacity
                onPress={handleTourSkip}
                style={styles.tourSkipButton}
              >
                <Text style={styles.tourSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTourNext}
                style={styles.tourNextButton}
              >
                <Text style={styles.tourNextText}>
                  {currentStep === tourSteps.length - 1
                    ? "Get Started"
                    : "Next"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient colors={["#2D6A4F", "#52B788"]} style={styles.header}>
        {/* Address Bar */}
        <TouchableOpacity
          style={styles.addressBar}
          onPress={() => router.push("/addresses")}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.addressText} numberOfLines={1}>
            {defaultAddress || "Add delivery address"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>

        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setNotificationsVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            {activeOrders.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search groceries...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2D6A4F" />
          </View>
        ) : (
          <View style={styles.content}>
            {/* Promotional Banner */}
            <LinearGradient
              colors={["#2D6A4F", "#4ADE80"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoBanner}
            >
              <View style={styles.promoContentWrapper}>
                <View style={styles.promoHeader}>
                  <View style={styles.promoIconLarge}>
                    <Ionicons name="pricetag" size={22} color="#2D6A4F" />
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
                  {"\n"}on Fresh Produce
                </Text>
                <TouchableOpacity style={styles.shopButton}>
                  <Text style={styles.shopButtonText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#2D6A4F" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScroll}
                >
                  {categories.map((cat, i) => renderCategoryItem(cat, i))}
                </ScrollView>
              </View>
            )}

            {/* Brands */}
            {brands.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Brands</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.brandScroll}
                >
                  {brands.map(renderBrandItem)}
                </ScrollView>
              </View>
            )}

            {/* Best Sellers */}
            {products.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Best Sellers</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.productScroll}
                >
                  {products.slice(0, 10).map(renderProductCard)}
                </ScrollView>
              </View>
            )}

            {/* All Products Grid */}
            {products.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>All Products</Text>
                </View>
                <View style={styles.productGrid}>
                  {products.map((product: any) => (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.gridProductCard}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.gridProductImageWrap}>
                        {product.image_url ? (
                          <Image
                            source={{ uri: product.image_url }}
                            style={styles.gridProductImage}
                          />
                        ) : (
                          <View style={styles.gridProductPlaceholder}>
                            <Ionicons
                              name="cube-outline"
                              size={32}
                              color="#ccc"
                            />
                          </View>
                        )}
                      </View>
                      <Text style={styles.gridProductName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      {product.brand && (
                        <Text style={styles.gridProductBrand}>
                          {product.brand.name}
                        </Text>
                      )}
                      <View style={styles.gridProductBottom}>
                        <Text style={styles.gridProductPrice}>
                          €{Number(product.price).toFixed(2)}
                        </Text>
                        {/* Pressable stops the touch from bubbling to the card's onPress */}
                        <Pressable
                          style={styles.addButton}
                          onPress={(e) => handleAddCart(e, product)}
                          hitSlop={8}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </Pressable>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 30 }} />
          </View>
        )}
      </ScrollView>

      {/* Render floating +1 animations globally */}
      {plusAnimations.map((anim) => (
        <FloatingPlusOne key={anim.id} x={anim.x} y={anim.y} />
      ))}
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingWrap: {
    paddingTop: 80,
    alignItems: "center",
  },

  // ── Header ──────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
  },
  addressText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    opacity: 0.95,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "800",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    color: isDark ? "#D1D5DB" : "#9CA3AF",
    fontSize: 15,
  },

  // ── Content ─────────────────────────────────────
  content: {
    paddingTop: 16,
  },

  // ── Promo ───────────────────────────────────────
  promoBanner: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
  },
  promoContentWrapper: {},
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  promoIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: isDark ? "#1F2937" : "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  promoLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  promoValidity: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },
  promoTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 16,
  },
  promoHighlight: {
    fontSize: 24,
    color: "#FFEB3B",
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#1F2937" : "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: "flex-start",
    gap: 6,
  },
  shopButtonText: {
    color: "#2D6A4F",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Section shared ──────────────────────────────
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: isDark ? "#F9FAFB" : "#1F2937",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D6A4F",
  },

  // ── Categories ──────────────────────────────────
  categoryScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    width: 72,
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: isDark ? "#D1D5DB" : "#4B5563",
    textAlign: "center",
  },

  // ── Brands ──────────────────────────────────────
  brandScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  brandCard: {
    alignItems: "center",
    width: 90,
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: isDark ? "#F9FAFB" : "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandImageWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  brandImage: {
    width: 50,
    height: 50,
  },
  brandPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 12,
    fontWeight: "700",
    color: isDark ? "#D1D5DB" : "#374151",
    textAlign: "center",
  },

  // ── Products (horizontal) ──────────────────────
  productScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 14,
  },
  productCard: {
    width: 160,
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: isDark ? "#F9FAFB" : "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  productImageWrap: {
    width: "100%",
    height: 120,
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255, 107, 53, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: isDark ? "#F9FAFB" : "#1F2937",
    marginBottom: 2,
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 11,
    color: isDark ? "#D1D5DB" : "#9CA3AF",
    fontWeight: "500",
    marginBottom: 8,
  },
  productBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D6A4F",
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Products Grid (all) ────────────────────────
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
  },
  gridProductCard: {
    width: "47%",
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: isDark ? "#F9FAFB" : "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  gridProductImageWrap: {
    width: "100%",
    height: 110,
    backgroundColor: isDark ? "#111827" : "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  gridProductImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridProductPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  gridProductName: {
    fontSize: 13,
    fontWeight: "700",
    color: isDark ? "#F9FAFB" : "#1F2937",
    marginTop: 10,
    marginHorizontal: 10,
    lineHeight: 17,
  },
  gridProductBrand: {
    fontSize: 11,
    color: isDark ? "#D1D5DB" : "#9CA3AF",
    fontWeight: "500",
    marginHorizontal: 10,
    marginTop: 2,
  },
  gridProductBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 6,
  },
  gridProductPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2D6A4F",
  },

  // ── Notifications ──────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  notifPanel: {
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 30,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#374151" : "#F3F4F6",
  },
  notifHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: isDark ? "#F9FAFB" : "#1F2937",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: isDark ? "#F9FAFB" : "#1F2937",
  },
  notifDescription: {
    fontSize: 13,
    color: isDark ? "#9CA3AF" : "#6B7280",
    marginTop: 2,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: isDark ? "#D1D5DB" : "#9CA3AF",
    marginTop: 4,
  },

  // ── Tour ───────────────────────────────────────
  tourOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  tourTooltip: {
    backgroundColor: isDark ? "#1F2937" : "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  tourHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  tourStepIndicator: {
    fontSize: 13,
    fontWeight: "600",
    color: isDark ? "#D1D5DB" : "#9CA3AF",
  },
  tourIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  tourTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: isDark ? "#F9FAFB" : "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  tourDescription: {
    fontSize: 15,
    color: isDark ? "#9CA3AF" : "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  tourDots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
  },
  tourDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: isDark ? "#374151" : "#E5E7EB",
  },
  tourDotActive: {
    backgroundColor: "#2D6A4F",
    width: 24,
  },
  tourActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  tourSkipButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: isDark ? "#374151" : "#E5E7EB",
  },
  tourSkipText: {
    fontSize: 15,
    fontWeight: "600",
    color: isDark ? "#9CA3AF" : "#6B7280",
  },
  tourNextButton: {
    flex: 2,
    flexDirection: "row",
    gap: 6,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#2D6A4F",
  },
  tourNextText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
