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
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual authentication logic
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push("/(auth)/signup");
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#F77F00", "#FFAA00"]}
        style={styles.gradient}
      >
        {/* Decorative Elements */}
        <DotsPattern style={styles.dotsPattern} />
        <Strawberry size={100} style={styles.strawberry} />
        <Pineapple size={120} style={styles.pineapple} />
        <Apple size={85} style={styles.apple} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="bag-check" size={32} color="#FF6B35" />
              </View>
            </View>

            <Text style={styles.title}>GroceryGo</Text>
            <Text style={styles.subtitle}>Your smart shopping companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to continue shopping
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
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.labelText}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  isLoading && styles.signInButtonDisabled,
                ]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={navigateToSignUp}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: "#000",
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
    shadowColor: "#000",
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
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 18,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "rgba(249, 250, 251, 0.8)",
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
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "600",
  },
  signInButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signUpLink: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  // Decorative fruit positions
  dotsPattern: {
    opacity: 0.4,
  },
  strawberry: {
    position: "absolute",
    top: 80,
    left: 20,
    opacity: 0.9,
  },
  pineapple: {
    position: "absolute",
    bottom: 100,
    right: 15,
    opacity: 0.9,
  },
  apple: {
    position: "absolute",
    top: 150,
    right: 30,
    opacity: 0.85,
  },
});
