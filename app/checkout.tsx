import { useCart } from "@/context/CartContext";
import { addressesApi, ordersApi } from "@/services/api";
import {
    capturePayPalOrder,
    createPayPalOrder,
    getApprovalUrl,
} from "@/services/paypal";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "cash" | "card" | "paypal";

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string }
> = {
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "time-outline",
    label: "Pending",
  },
  processing: {
    color: "#2563EB",
    bg: "#DBEAFE",
    icon: "refresh-outline",
    label: "Processing",
  },
  shipped: {
    color: "#7C3AED",
    bg: "#EDE9FE",
    icon: "bicycle-outline",
    label: "Shipped",
  },
  delivered: {
    color: "#059669",
    bg: "#D1FAE5",
    icon: "checkmark-circle-outline",
    label: "Delivered",
  },
  cancelled: {
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: "close-circle-outline",
    label: "Cancelled",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [placing, setPlacing] = useState(false);

  // Card fields (Stripe simulation)
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const DELIVERY_FEE = 2.99;
  const discountAmount = cartTotal * 0.2;
  const orderTotal = cartTotal - discountAmount + DELIVERY_FEE;

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    const res = await addressesApi.getAll();
    if (res.data && Array.isArray(res.data)) {
      const list = res.data as Address[];
      setAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0] ?? null;
      setSelectedAddress(def);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!selectedAddress) {
      Alert.alert("No address", "Please add a delivery address first.");
      return false;
    }
    if (cartItems.length === 0) {
      Alert.alert("Empty cart", "Add some items before placing an order.");
      return false;
    }
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) {
        Alert.alert(
          "Invalid card",
          "Please enter a valid 16-digit card number.",
        );
        return false;
      }
      if (cardExpiry.length < 5) {
        Alert.alert("Invalid expiry", "Please enter card expiry (MM/YY).");
        return false;
      }
      if (cardCVC.length < 3) {
        Alert.alert("Invalid CVC", "Please enter a valid CVC.");
        return false;
      }
    }
    return true;
  };

  // ── PayPal Payment Processing ──────────────────────────────────────────────
  //
  // Flow:
  //  1. Create the DB order  ← amount is locked on the server
  //  2. Create PayPal order  ← server resolves amount from DB
  //  3. Open PayPal in browser for user approval
  //  4. Capture PayPal payment
  //
  const handlePayPalPayment = async (): Promise<number> => {
    // ── Step 1: create the DB order first ─────────────────────────────────
    const deliveryStr = selectedAddress
      ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zip_code}, ${selectedAddress.country}`
      : "";

    const payload = {
      order: {
        total: orderTotal,
        address_id: selectedAddress?.id,
        delivery_address: deliveryStr,
        delivery_fee: DELIVERY_FEE,
        status: "pending",
      },
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    const orderResult = await ordersApi.create(payload);
    if (orderResult.error || !orderResult.data) {
      throw new Error(orderResult.error || "Failed to create order");
    }
    const dbOrderId: number = orderResult.data.id;

    // ── Step 2: create PayPal order (amount resolved server-side) ─────────
    const paypalOrder = await createPayPalOrder(dbOrderId);
    const approvalUrl = getApprovalUrl(paypalOrder.links);
    if (!approvalUrl) throw new Error("Could not get PayPal approval URL");

    // ── Step 3: open PayPal in browser ────────────────────────────────────
    const browserResult = await WebBrowser.openBrowserAsync(approvalUrl);
    if (browserResult.type === "cancel") {
      throw new Error("Payment cancelled by user");
    }

    // ── Step 4: capture (server verifies ownership via order_id + JWT) ─────
    await capturePayPalOrder(paypalOrder.id, dbOrderId);

    return dbOrderId;
  };

  // ── Place Order ────────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);

    try {
      if (paymentMethod === "paypal") {
        try {
          const dbOrderId = await handlePayPalPayment();
          clearCart();
          const deliveryStr = selectedAddress
            ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zip_code}, ${selectedAddress.country}`
            : "";
          router.replace({
            pathname: "/order-confirmation",
            params: {
              orderId: dbOrderId,
              total: orderTotal.toFixed(2),
              paymentMethod,
              itemCount: cartItems.length,
              address: deliveryStr,
            },
          } as any);
        } catch (paypalError: any) {
          const msg =
            paypalError?.message || "Could not process PayPal payment.";
          Alert.alert("PayPal Payment Failed", msg);
        }
        return;
      }

      // ── Cash / Card ────────────────────────────────────────────────────
      if (paymentMethod === "card") {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const deliveryStr = selectedAddress
        ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zip_code}, ${selectedAddress.country}`
        : "";

      const payload = {
        order: {
          total: orderTotal,
          address_id: selectedAddress?.id,
          delivery_address: deliveryStr,
          delivery_fee: DELIVERY_FEE,
          status: "pending",
        },
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const result = await ordersApi.create(payload);

      if (result.error || !result.data) {
        Alert.alert(
          "Order failed",
          result.error || "Something went wrong. Please try again.",
        );
        return;
      }

      clearCart();
      router.replace({
        pathname: "/order-confirmation",
        params: {
          orderId: result.data.id,
          total: orderTotal.toFixed(2),
          paymentMethod,
          itemCount: cartItems.length,
          address: deliveryStr,
        },
      } as any);
    } catch {
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setPlacing(false);
    }
  };

  // ── Format card number with spaces ─────────────────────────────────────────

  const formatCard = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, 16);
    return clean.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Delivery Address ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={16} color="#2D6A4F" />{" "}
            Delivery Address
          </Text>
          {addresses.length === 0 ? (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => router.push("/add-address" as any)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2D6A4F" />
              <Text style={styles.addAddressText}>Add a delivery address</Text>
            </TouchableOpacity>
          ) : (
            addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[
                  styles.addressCard,
                  selectedAddress?.id === addr.id && styles.addressCardSelected,
                ]}
                onPress={() => setSelectedAddress(addr)}
              >
                <View style={styles.addressCardLeft}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedAddress?.id === addr.id &&
                        styles.radioOuterSelected,
                    ]}
                  >
                    {selectedAddress?.id === addr.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.addressLabel}>
                      {addr.label.toUpperCase()}
                    </Text>
                    <Text style={styles.addressStreet}>{addr.street}</Text>
                    <Text style={styles.addressCity}>
                      {addr.city}, {addr.zip_code}
                    </Text>
                  </View>
                </View>
                {addr.is_default && (
                  <View style={styles.defaultTag}>
                    <Text style={styles.defaultTagText}>Default</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── Order Summary ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="receipt-outline" size={16} color="#2D6A4F" /> Order
            Summary
          </Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItemRow}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.itemThumb}
                />
              ) : (
                <View style={[styles.itemThumb, styles.itemThumbPlaceholder]}>
                  <Ionicons name="cube-outline" size={18} color="#D1D5DB" />
                </View>
              )}
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                €{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>€{cartTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Special Offer (20% Off)</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: "#059669", fontWeight: "600" },
              ]}
            >
              -€{discountAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>€{DELIVERY_FEE.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>€{orderTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Payment Method ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="card-outline" size={16} color="#2D6A4F" /> Payment
            Method
          </Text>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.payOption,
              paymentMethod === "cash" && styles.payOptionSelected,
            ]}
            onPress={() => setPaymentMethod("cash")}
          >
            <View style={styles.payOptionLeft}>
              <View style={[styles.payIconBg, { backgroundColor: isDark ? "rgba(5, 150, 105, 0.2)" : "#D1FAE5" }]}>
                <Ionicons name="cash-outline" size={22} color="#059669" />
              </View>
              <View>
                <Text style={styles.payOptionTitle}>Cash on Delivery</Text>
                <Text style={styles.payOptionSub}>
                  Pay when your order arrives
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === "cash" && styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === "cash" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {/* Card (Stripe) */}
          <TouchableOpacity
            style={[
              styles.payOption,
              paymentMethod === "card" && styles.payOptionSelected,
            ]}
            onPress={() => setPaymentMethod("card")}
          >
            <View style={styles.payOptionLeft}>
              <View style={[styles.payIconBg, { backgroundColor: isDark ? "rgba(124, 58, 237, 0.2)" : "#EDE9FE" }]}>
                <Ionicons name="card-outline" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.payOptionTitle}>Credit / Debit Card</Text>
                <Text style={styles.payOptionSub}>Visa, Mastercard, Amex</Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === "card" && styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === "card" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {paymentMethod === "card" && (
            <View style={styles.cardInputs}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCard(t))}
                maxLength={19}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Expiry</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    value={cardExpiry}
                    onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>CVC</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="number-pad"
                    value={cardCVC}
                    onChangeText={(t) =>
                      setCardCVC(t.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
              <View style={styles.secureNote}>
                <Ionicons
                  name="lock-closed-outline"
                  size={12}
                  color="#6B7280"
                />
                <Text style={styles.secureText}>
                  Secured by Stripe · 256-bit SSL
                </Text>
              </View>
            </View>
          )}

          {/* PayPal */}
          <TouchableOpacity
            style={[
              styles.payOption,
              paymentMethod === "paypal" && styles.payOptionSelected,
            ]}
            onPress={() => setPaymentMethod("paypal")}
          >
            <View style={styles.payOptionLeft}>
              <View style={[styles.payIconBg, { backgroundColor: isDark ? "rgba(37, 99, 235, 0.2)" : "#DBEAFE" }]}>
                <Ionicons name="logo-paypal" size={22} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.payOptionTitle}>PayPal</Text>
                <Text style={styles.payOptionSub}>
                  Fast &amp; secure PayPal checkout
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioOuter,
                paymentMethod === "paypal" && styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === "paypal" && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          {paymentMethod === "paypal" && (
            <View style={styles.paypalNote}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#2563EB"
              />
              <Text style={styles.paypalNoteText}>
                You'll be redirected to PayPal to complete your payment
                securely.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Place Order Button ────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <LinearGradient
          colors={["#2D6A4F", "#40916C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.placeOrderBtn}
        >
          <TouchableOpacity
            style={styles.placeOrderInner}
            onPress={handlePlaceOrder}
            disabled={placing}
          >
            {placing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.placeOrderText}>
                  {paymentMethod === "paypal"
                    ? "Redirecting to PayPal…"
                    : "Placing Order…"}
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#fff"
                />
                <Text style={styles.placeOrderText}>
                  Place Order · €{orderTotal.toFixed(2)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#111827" : "#F9FAFB" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#374151" : "#F3F4F6",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? "#111827" : "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    scroll: { padding: 16 },
    section: {
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
      marginBottom: 14,
    },

    // Address
    addAddressBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: "#2D6A4F",
      borderStyle: "dashed",
    },
    addAddressText: { color: "#2D6A4F", fontWeight: "600" },
    addressCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      marginBottom: 10,
    },
    addressCardSelected: { borderColor: "#2D6A4F", backgroundColor: isDark ? "rgba(45, 106, 79, 0.15)" : "#F0FDF4" },
    addressCardLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      flex: 1,
    },
    addressLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#9CA3AF" : "#6B7280",
      letterSpacing: 0.5,
    },
    addressStreet: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
      marginTop: 2,
    },
    addressCity: { fontSize: 13, color: isDark ? "#9CA3AF" : "#6B7280" },
    defaultTag: {
      backgroundColor: "#D1FAE5",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    defaultTagText: { fontSize: 11, color: "#059669", fontWeight: "600" },

    // Radio
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#D1D5DB",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    radioOuterSelected: { borderColor: "#2D6A4F" },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#2D6A4F",
    },

    // Order items
    orderItemRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      gap: 10,
    },
    itemThumb: { width: 40, height: 40, borderRadius: 8 },
    itemThumbPlaceholder: {
      backgroundColor: isDark ? "#111827" : "#f3f4f6",
      alignItems: "center",
      justifyContent: "center",
    },
    itemName: {
      flex: 1,
      fontSize: 14,
      color: isDark ? "#D1D5DB" : "#374151",
      fontWeight: "500",
    },
    itemQty: {
      fontSize: 13,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginRight: 4,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
      minWidth: 60,
      textAlign: "right",
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#111827" : "#f3f4f6",
      marginVertical: 10,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    summaryLabel: { fontSize: 14, color: isDark ? "#9CA3AF" : "#6B7280" },
    summaryValue: { fontSize: 14, color: isDark ? "#D1D5DB" : "#374151" },
    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    totalValue: { fontSize: 18, fontWeight: "800", color: "#2D6A4F" },

    // Payment
    payOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      marginBottom: 10,
    },
    payOptionSelected: { borderColor: "#2D6A4F", backgroundColor: isDark ? "rgba(45, 106, 79, 0.15)" : "#F0FDF4" },
    payOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    payIconBg: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    payOptionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#F9FAFB" : "#111827",
    },
    payOptionSub: {
      fontSize: 12,
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginTop: 2,
    },

    // Card inputs
    cardInputs: { marginTop: 4, marginBottom: 4 },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#9CA3AF" : "#6B7280",
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      borderWidth: 1.5,
      borderColor: isDark ? "#374151" : "#E5E7EB",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: isDark ? "#F9FAFB" : "#111827",
      backgroundColor: isDark ? "#1F2937" : "#FAFAFA",
    },
    row: { flexDirection: "row" },
    secureNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 10,
    },
    secureText: { fontSize: 11, color: isDark ? "#D1D5DB" : "#9CA3AF" },

    // PayPal note
    paypalNote: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: isDark ? "#1E3A8A" : "#EFF6FF",
      padding: 12,
      borderRadius: 10,
      marginTop: 4,
    },
    paypalNoteText: {
      fontSize: 13,
      color: isDark ? "#BFDBFE" : "#1D4ED8",
      flex: 1,
      lineHeight: 18,
    },

    // Footer
    footer: {
      padding: 16,
      backgroundColor: isDark ? "#1F2937" : "#fff",
      borderTopWidth: 1,
      borderTopColor: isDark ? "#374151" : "#F3F4F6",
    },
    placeOrderBtn: { borderRadius: 14, overflow: "hidden" },
    placeOrderInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
    },
    placeOrderText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  });
