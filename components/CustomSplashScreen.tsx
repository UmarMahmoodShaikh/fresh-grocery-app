import { Apple, Pineapple, Strawberry } from "@/components/FruitDecorations";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function CustomSplashScreen({ onComplete }: { onComplete: () => void }) {
    const fadeAnim = new Animated.Value(1);
    const scaleLogoAnim = new Animated.Value(0.5);
    const translateYAnim = new Animated.Value(20);
    const titleOpacityAnim = new Animated.Value(0);

    useEffect(() => {
        async function prepare() {
            try {
                // Run some artificial delay to let initial app mount completely 
                // Typically you would fetch data or check login status here,
                // Since we are decoupling the splash screen visual, we'll delay for smooth effect.
                await new Promise(resolve => setTimeout(resolve, 600));

                // Hide the native static Expo splash screen and instantly replace it with our animated one.
                await SplashScreen.hideAsync();

                // 1. Zoom in the logo and fade up the text
                Animated.parallel([
                    Animated.spring(scaleLogoAnim, {
                        toValue: 1,
                        friction: 5,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(titleOpacityAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]).start();

                // 2. Let the user admire it briefly, then cross-fade it away.
                setTimeout(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }).start(() => {
                        onComplete(); // Remove this overlay entirely
                    });
                }, 2200);

            } catch (e) {
                console.warn(e);
                onComplete();
            }
        }

        prepare();
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <LinearGradient
                colors={["#2D6A4F", "#52B788", "#74C69D"]}
                style={styles.gradient}
            >
                <Strawberry size={120} style={styles.strawberry} />
                <Pineapple size={140} style={styles.pineapple} />
                <Apple size={100} style={styles.apple} />

                <View style={styles.content}>
                    <Animated.View style={[styles.logoCircle, { transform: [{ scale: scaleLogoAnim }] }]}>
                        <Ionicons name="bag-check" size={56} color="#2D6A4F" />
                    </Animated.View>

                    <Animated.View style={{ opacity: titleOpacityAnim, transform: [{ translateY: translateYAnim }], alignItems: 'center' }}>
                        <Text style={styles.title}>Fresh Grocery</Text>
                        <Text style={styles.subtitle}>Premium Quality Delivered</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject, // Ensure it overlaps everything
        zIndex: 99999,
    },
    gradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
        justifyContent: "center",
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 42,
        color: "white",
        fontWeight: "bold",
        marginBottom: 8,
        textShadowColor: "rgba(0, 0, 0, 0.2)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    subtitle: {
        fontSize: 18,
        color: "white",
        opacity: 0.9,
        fontWeight: "600",
    },
    strawberry: {
        position: "absolute",
        top: "15%",
        right: "5%",
        transform: [{ rotate: "15deg" }],
        opacity: 0.85,
    },
    pineapple: {
        position: "absolute",
        bottom: "10%",
        left: "-8%",
        transform: [{ rotate: "-20deg" }],
        opacity: 0.85,
    },
    apple: {
        position: "absolute",
        top: "40%",
        left: "5%",
        transform: [{ rotate: "-10deg" }],
        opacity: 0.85,
    },
});
