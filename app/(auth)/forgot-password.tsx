import {
  Apple,
  DotsPattern,
  Pineapple,
  Strawberry,
} from "@/components/FruitDecorations";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export default function ForgotPasswordScreen() {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual password reset logic
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
      Alert.alert(
        "Success",
        "Password reset instructions have been sent to your email.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#2D6A4F", "#52B788", "#74C69D"]}
        style={styles.gradient}
      >
        {/* Decorative Elements */}
        <DotsPattern style={styles.dotsPattern} />
        <Strawberry size={95} style={styles.strawberry} />
        <Pineapple size={110} style={styles.pineapple} />
        <Apple size={80} style={styles.apple} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Back Button - Top Left of Screen */}
          <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="bag-check" size={32} color="#2D6A4F" />
              </View>
            </View>

            <Text style={styles.title}>GroceryGo</Text>
            <Text style={styles.subtitle}>Your smart shopping companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>
              Enter your email address and we'll send you instructions to reset
              your password
            </Text>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.labelText}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    placeholderTextColor="#6B7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  isLoading && styles.resetButtonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                <Text style={styles.resetButtonText}>
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </Text>
              </TouchableOpacity>

              {/* Back to Login Link */}
              <View style={styles.backToLoginContainer}>
                <Text style={styles.backToLoginText}>
                  Remember your password?{" "}
                </Text>
                <TouchableOpacity onPress={navigateBack}>
                  <Text style={styles.backToLoginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    backButton: {
      position: "absolute",
      top: 20,
      left: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    logoContainer: {
      marginBottom: 12,
    },
    logoCircle: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: "white",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "white",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: "white",
      opacity: 0.9,
    },
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.20)",
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 28,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      shadowColor: isDark ? "#F9FAFB" : "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 12,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "white",
      marginBottom: 4,
      textAlign: "center",
    },
    cardSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: 24,
      textAlign: "center",
      lineHeight: 20,
    },
    form: {
      width: "100%",
    },
    inputContainer: {
      marginBottom: 24,
    },
    labelText: {
      fontSize: 14,
      fontWeight: "600",
      color: "white",
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 10,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: "#111827",
    },
    resetButton: {
      backgroundColor: "#2D6A4F",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 20,
      shadowColor: "#2D6A4F",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
    },
    backToLoginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    backToLoginText: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.8)",
    },
    backToLoginLink: {
      fontSize: 14,
      color: "white",
      fontWeight: "bold",
    },
    // Decorative fruit positions
    dotsPattern: {
      opacity: 0.4,
    },
    strawberry: {
      position: "absolute",
      top: 120,
      left: 20,
      opacity: 0.9,
    },
    pineapple: {
      position: "absolute",
      bottom: 100,
      right: 20,
      opacity: 0.9,
    },
    apple: {
      position: "absolute",
      top: 200,
      right: 25,
      opacity: 0.85,
    },
  });
