import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";

const Basket = ({ size = 90 }: { size?: number }) => (
    <Svg width={size} height={size * 0.75} viewBox="0 0 120 90">
        {/* Basket body */}
        <Path
            d="M15 35 Q20 80 60 82 Q100 80 105 35 Z"
            fill="#D4A055"
            stroke="#B8832A"
            strokeWidth="2"
        />
        {/* Weave lines horizontal */}
        <Path d="M18 50 Q60 52 102 50" stroke="#B8832A" strokeWidth="1.5" fill="none" strokeDasharray="6,4" />
        <Path d="M20 62 Q60 65 100 62" stroke="#B8832A" strokeWidth="1.5" fill="none" strokeDasharray="6,4" />
        <Path d="M23 73 Q60 76 97 73" stroke="#B8832A" strokeWidth="1.5" fill="none" strokeDasharray="6,4" />
        {/* Weave lines vertical */}
        <Path d="M35 35 Q33 60 30 82" stroke="#B8832A" strokeWidth="1" fill="none" />
        <Path d="M50 35 Q50 60 49 82" stroke="#B8832A" strokeWidth="1" fill="none" />
        <Path d="M70 35 Q70 60 71 82" stroke="#B8832A" strokeWidth="1" fill="none" />
        <Path d="M85 35 Q87 60 90 82" stroke="#B8832A" strokeWidth="1" fill="none" />
        {/* Basket rim */}
        <Ellipse cx="60" cy="35" rx="46" ry="10" fill="#E8B466" stroke="#B8832A" strokeWidth="2" />
        {/* Basket handle */}
        <Path
            d="M30 35 Q30 5 60 5 Q90 5 90 35"
            fill="none"
            stroke="#B8832A"
            strokeWidth="5"
            strokeLinecap="round"
        />
        {/* Shadow */}
        <Ellipse cx="60" cy="89" rx="40" ry="4" fill="rgba(0,0,0,0.1)" />
    </Svg>
);

const FRUITS = [
    { emoji: "🍎", label: "Apple" },
    { emoji: "🍋", label: "Lemon" },
    { emoji: "🍇", label: "Grapes" },
    { emoji: "🥦", label: "Broccoli" },
    { emoji: "🥕", label: "Carrot" },
];

interface FruitProps {
    emoji: string;
    delay: number;
    totalDuration: number;
}

const DroppingFruit: React.FC<FruitProps> = ({ emoji, delay, totalDuration }) => {
    const translateY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                // Wait for my turn
                Animated.delay(delay),
                // Appear and start spinning as it falls
                Animated.parallel([
                    Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(translateY, {
                        toValue: 0,
                        duration: 500,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotate, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                ]),
                // Squash on landing
                Animated.timing(scale, {
                    toValue: 1.3,
                    duration: 80,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.9,
                    duration: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 80,
                    useNativeDriver: true,
                }),
                // Fade out once settled
                Animated.delay(150),
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                // Reset to top
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -80, duration: 0, useNativeDriver: true }),
                    Animated.timing(rotate, { toValue: 0, duration: 0, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                ]),
                // Stay hidden until next cycle
                Animated.delay(totalDuration - delay - 500 - 80 - 80 - 80 - 150 - 200),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "25deg"] });

    return (
        <Animated.Text
            style={[
                styles.fruitEmoji,
                {
                    opacity,
                    transform: [{ translateY }, { scale }, { rotate: spin }],
                },
            ]}
        >
            {emoji}
        </Animated.Text>
    );
};

// ─── Basket bounce ─────────────────────────────────────────────────────────── 

const BouncingBasket: React.FC<{ totalDuration: number }> = ({ totalDuration }) => {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence(
                FRUITS.map((_, i) =>
                    Animated.sequence([
                        Animated.delay(i === 0 ? 0 : 0),
                        Animated.delay(i * (totalDuration / FRUITS.length) + 500 - 50),
                        // small nudge down when fruit lands
                        Animated.timing(translateY, {
                            toValue: 5,
                            duration: 80,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: 0,
                            duration: 120,
                            easing: Easing.bounce,
                            useNativeDriver: true,
                        }),
                    ])
                )
            )
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return (
        <Animated.View style={{ transform: [{ translateY }] }}>
            <Basket size={100} />
        </Animated.View>
    );
};

// ─── Public component ──────────────────────────────────────────────────────── 

interface BasketLoaderProps {
    /** Optional text shown below the basket */
    text?: string;
    /** Whole-container style override */
    style?: ViewStyle;
    /** Wrapper background — set to "transparent" for overlays */
    backgroundColor?: string;
}

const INTERVAL = 600; // ms per fruit
const TOTAL = FRUITS.length * INTERVAL;

export const BasketLoader: React.FC<BasketLoaderProps> = ({
    text = "Loading fresh items…",
    style,
    backgroundColor = "#ffffff",
}) => {
    return (
        <View style={[styles.container, { backgroundColor }, style]}>
            <View style={styles.scene}>
                {/* Dropping fruits — each offset by INTERVAL */}
                {FRUITS.map((fruit, i) => (
                    <DroppingFruit
                        key={fruit.label}
                        emoji={fruit.emoji}
                        delay={i * INTERVAL}
                        totalDuration={TOTAL}
                    />
                ))}

                {/* Basket */}
                <BouncingBasket totalDuration={TOTAL} />
            </View>

            {text ? <Text style={styles.text}>{text}</Text> : null}
        </View>
    );
};

// ─── Full-screen overlay variant ───────────────────────────────────────────── 

export const BasketLoaderOverlay: React.FC<{ text?: string }> = ({ text }) => (
    <View style={styles.overlay}>
        <BasketLoader text={text} backgroundColor="transparent" />
    </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────── 

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
    },
    scene: {
        width: 120,
        height: 140,
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
    },
    fruitEmoji: {
        fontSize: 32,
        position: "absolute",
        top: 0,
        left: "50%",
        marginLeft: -16,
    },
    text: {
        marginTop: 18,
        fontSize: 15,
        fontWeight: "600",
        color: "#4B5563",
        letterSpacing: 0.2,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
    },
});
