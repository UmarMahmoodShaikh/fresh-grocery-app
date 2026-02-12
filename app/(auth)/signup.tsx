import {
  Apple,
  Banana,
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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!agreementChecked) {
      Alert.alert(
        "Error",
        "Please agree to the Terms of Service and Privacy Policy",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual registration logic
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF6B35", "#F77F00", "#FFAA00"]}
        style={styles.gradient}
      >
        {/* Decorative Elements */}
        <DotsPattern style={styles.dotsPattern} />
        <Strawberry size={95} style={styles.strawberry} />
        <Pineapple size={115} style={styles.pineapple} />
        <Banana size={75} style={styles.banana} />
        <Apple size={70} style={styles.apple} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Join GroceryGo today</Text>

              <View style={styles.form}>
                {/* Full Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.labelText}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

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
                      placeholder="Create a password"
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

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.labelText}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms of Service Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreementChecked(!agreementChecked)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      agreementChecked && styles.checkboxChecked,
                    ]}
                  >
                    {agreementChecked && (
                      <Ionicons name="checkmark" size={12} color="white" />
                    )}
                  </View>
                  <Text style={styles.agreementText}>
                    I agree to the{" "}
                    <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                    <Text style={styles.linkText}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    isLoading && styles.signUpButtonDisabled,
                  ]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.signUpButtonText}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Text>
                </TouchableOpacity>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={navigateToLogin}>
                    <Text style={styles.signInLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingVertical: 18,
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
    marginBottom: 14,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 12,
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
    paddingVertical: 10,
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
  signUpButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
    shadowColor: "#FF6B35",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signInLink: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  linkText: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  // Decorative fruit positions
  dotsPattern: {
    opacity: 0.4,
  },
  strawberry: {
    position: "absolute",
    top: 70,
    left: 15,
    opacity: 0.9,
  },
  pineapple: {
    position: "absolute",
    bottom: 80,
    right: 10,
    opacity: 0.9,
  },
  banana: {
    position: "absolute",
    top: 180,
    right: 20,
    opacity: 0.85,
  },
  apple: {
    position: "absolute",
    bottom: 200,
    left: 25,
    opacity: 0.85,
  },
});
